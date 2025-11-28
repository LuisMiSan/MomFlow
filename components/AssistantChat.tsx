
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini, parseTextToEvent, connectLiveAssistant, parseTextToTask } from '../services/geminiService';
import { 
    SendIcon, MicrophoneIcon, StopIcon, LoadingIcon, CalendarDaysIcon, 
    ClipboardListIcon, UsersIcon, SparklesIcon, ShoppingBagIcon, Cog6ToothIcon 
} from './Icons';
import { LiveSession, LiveServerMessage } from '@google/genai';
import { Event, Contact, FamilyProfile } from '../types';

interface Message {
  text: string;
  isUser: boolean;
  isTranscription?: boolean;
}

type Screen = 'calendar' | 'tasks' | 'wellbeing' | 'contacts' | 'shopping' | 'settings';

interface LinaChatScreenProps {
  onNavigate: (screen: Screen) => void;
  onAddTask: (task: { text: string; list: string }) => void;
  onAddEvent: (event: Omit<Event, 'id' | 'source' | 'reminder' | 'recurring'>) => void;
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  isGoogleCalendarConnected: boolean;
  familyProfile: FamilyProfile;
}

// Audio utility functions
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const encode = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const LinaChatScreen: React.FC<LinaChatScreenProps> = ({ onNavigate, onAddTask, onAddEvent, onAddContact, isGoogleCalendarConnected, familyProfile }) => {
  const [messages, setMessages] = useState<Message[]>([{ text: 'Hola, soy LINA. ¿En qué puedo ayudarte hoy?', isUser: false }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const sessionPromise = useRef<Promise<LiveSession> | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const nextStartTime = useRef(0);
  const audioSources = useRef(new Set<AudioBufferSourceNode>());
  const toolCalledThisTurn = useRef(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processUserInput = async (text: string) => {
    setIsLoading(true);

    const event = await parseTextToEvent(text);
    if(event && event.title && event.date && event.category) {
        onAddEvent(event);
        const confirmationText = `¡Evento creado! "${event.title}" el ${event.date} a las ${event.time || 'hora no especificada'} en la categoría ${event.category}.`;
        const googleText = isGoogleCalendarConnected ? " También lo he añadido a tu Google Calendar." : "";

        const eventMessage : Message = {
            text: confirmationText + googleText,
            isUser: false,
        };
        setMessages(prev => [...prev, eventMessage]);
    } else {
        const task = await parseTextToTask(text);
        if (task && task.task && task.list) {
            onAddTask(task);
            const taskMessage : Message = {
                text: `¡Añadido! "${task.task}" a tu lista de ${task.list}.`,
                isUser: false,
            };
            setMessages(prev => [...prev, taskMessage]);
        } else {
            const response = await sendMessageToGemini(text);
            const botMessage: Message = { text: response, isUser: false };
            setMessages(prev => [...prev, botMessage]);
        }
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const textToProcess = input;
    const userMessage: Message = { text: textToProcess, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    await processUserInput(textToProcess);
  };

  const handleLiveToggle = async () => {
    if (isLive) {
        if (sessionPromise.current) sessionPromise.current.then(session => session.close());
        if (mediaStream.current) mediaStream.current.getTracks().forEach(track => track.stop());
        if (scriptProcessor.current) scriptProcessor.current.disconnect();
        if (audioContext.current?.state !== 'closed') audioContext.current.close();
        if (outputAudioContext.current?.state !== 'closed') outputAudioContext.current.close();
        audioSources.current.forEach(source => source.stop());
        sessionPromise.current = null;
        mediaStream.current = null;
        scriptProcessor.current = null;
        audioSources.current.clear();
        setIsLive(false);
        setIsConnecting(false);
    } else {
        setIsConnecting(true);
        outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        sessionPromise.current = connectLiveAssistant({
            onopen: async () => {
                setIsLive(true);
                setIsConnecting(false);
                try {
                    mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = audioContext.current.createMediaStreamSource(mediaStream.current);
                    scriptProcessor.current = audioContext.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.current.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const pcmBlob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromise.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(scriptProcessor.current);
                    scriptProcessor.current.connect(audioContext.current.destination);
                } catch (err) {
                    console.error("Microphone access denied:", err);
                    setMessages(prev => [...prev, { text: "Error: Se necesita acceso al micrófono.", isUser: false }]);
                    setIsConnecting(false);
                }
            },
            onmessage: async (message: LiveServerMessage) => {
                 if (message.toolCall) {
                    for (const fc of message.toolCall.functionCalls) {
                        toolCalledThisTurn.current = true;
                        let toolResponseResult = "Acción no completada.";
                        if (fc.name === 'addTask' && fc.args) {
                            const task = { text: fc.args.task as string, list: fc.args.list as string };
                            if (task.text && task.list) {
                                onAddTask(task);
                                toolResponseResult = `Tarea "${task.text}" añadida a la lista "${task.list}".`;
                            }
                        } else if (fc.name === 'addContact' && fc.args) {
                             const contact = { name: fc.args.name as string, relation: fc.args.relation as string, phone: fc.args.phone as string, notes: fc.args.notes as string | undefined };
                             if (contact.name && contact.relation && contact.phone) {
                                 onAddContact(contact);
                                 toolResponseResult = `Contacto "${contact.name}" añadido.`;
                             }
                        }
                        sessionPromise.current?.then((session) => {
                            session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: toolResponseResult } } });
                        });
                    }
                }

                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio && outputAudioContext.current) {
                    nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.current.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext.current, 24000, 1);
                    const source = outputAudioContext.current.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputAudioContext.current.destination);
                    source.addEventListener('ended', () => audioSources.current.delete(source));
                    source.start(nextStartTime.current);
                    nextStartTime.current += audioBuffer.duration;
                    audioSources.current.add(source);
                }

                const updateTranscription = (text: string, isUser: boolean) => {
                    setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage?.isUser === isUser && lastMessage.isTranscription) {
                            return [...prev.slice(0, -1), { ...lastMessage, text: lastMessage.text + text }];
                        }
                        return [...prev, { text, isUser, isTranscription: true }];
                    });
                };

                if (message.serverContent?.inputTranscription) updateTranscription(message.serverContent.inputTranscription.text, true);
                if (message.serverContent?.outputTranscription) updateTranscription(message.serverContent.outputTranscription.text, false);
                
                if (message.serverContent?.turnComplete) {
                    setMessages(prev => prev.map(m => ({ ...m, isTranscription: false })));
                    toolCalledThisTurn.current = false;
                }
            },
            onerror: (e) => {
                console.error('Live session error:', e);
                setMessages(prev => [...prev, { text: "Error de conexión. Intenta de nuevo.", isUser: false }]);
                if (isLive) handleLiveToggle();
            },
            onclose: () => {
                setIsLive(false);
                setIsConnecting(false);
            }
        });
    }
  };

  const navItems = [
    { label: 'Calendario', screen: 'calendar' as Screen, icon: CalendarDaysIcon },
    { label: 'Tareas', screen: 'tasks' as Screen, icon: ClipboardListIcon },
    { label: 'Contactos', screen: 'contacts' as Screen, icon: UsersIcon },
    { label: 'Bienestar', screen: 'wellbeing' as Screen, icon: SparklesIcon },
    { label: 'Compras', screen: 'shopping' as Screen, icon: ShoppingBagIcon },
    { label: 'Ajustes', screen: 'settings' as Screen, icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#38a6e9] relative">
      {/* Background Image Layer */}
      <div className="absolute top-0 left-0 w-full h-1/2 z-0">
         <img 
            src={familyProfile.photoUrl} 
            alt="Family" 
            className="w-full h-full object-cover opacity-90" 
         />
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#38a6e9]/20"></div>
      </div>

      {/* Main Content Card - Curved Up */}
      <div className="flex flex-col flex-1 z-10 mt-[35vh] bg-white rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden">
         
         {/* Small handle indicator */}
         <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1"></div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                    msg.isUser 
                    ? 'bg-[#38a6e9] text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                } ${msg.isTranscription ? 'opacity-70 italic' : ''}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
            </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl bg-gray-100 rounded-bl-none">
                        <LoadingIcon className="w-5 h-5 animate-spin text-gray-500" />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} className="pb-20" /> {/* Extra padding for input area */}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center space-x-2 bg-gray-50 rounded-full p-1 border border-gray-200">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none"
                    disabled={isLoading || isLive}
                />
                <button 
                    onClick={handleLiveToggle} 
                    className={`p-2 rounded-full transition-colors ${isLive ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-[#38a6e9]'}`}
                    disabled={isConnecting || isLoading}
                >
                    {isConnecting ? <LoadingIcon className="w-5 h-5 animate-spin"/> : isLive ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                </button>
                <button 
                    onClick={handleSend} 
                    disabled={isLoading || isLive || !input.trim()} 
                    className="p-2 bg-[#38a6e9] text-white rounded-full hover:bg-blue-500 transition-colors shadow-sm disabled:bg-gray-300"
                >
                    <SendIcon className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="grid grid-cols-6 gap-1 p-2 bg-white border-t border-gray-100 pb-safe">
            {navItems.map(item => (
            <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-blue-50 focus:outline-none transition-colors group"
                aria-label={item.label}
            >
                <item.icon className="w-6 h-6 text-gray-400 group-hover:text-[#38a6e9] transition-colors" />
                <span className="text-[9px] font-medium text-gray-500 mt-1 group-hover:text-[#38a6e9]">{item.label}</span>
            </button>
            ))}
        </nav>
      </div>
    </div>
  );
};

export default LinaChatScreen;
