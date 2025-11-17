import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessageToGemini, parseTextToEvent, connectLiveAssistant, getEventFromImage, parseTextToTask } from '../services/geminiService';
import { SendIcon, XMarkIcon, MicrophoneIcon, StopIcon, LoadingIcon, VoiceMemoIcon } from './Icons';
import { LiveSession, LiveServerMessage } from '@google/genai';
import { Event, Category } from '../types';


interface Message {
  text: string;
  isUser: boolean;
  isTranscription?: boolean;
  audioUrl?: string;
}

interface AssistantChatProps {
  onClose: () => void;
  initialImage?: { base64: string, mimeType: string } | null;
  initialText?: string | null;
  initialAction?: string | null;
  onAddTask: (task: { text: string; list: string }) => void;
  onAddEvent: (event: Omit<Event, 'id' | 'source' | 'reminder' | 'recurring'>) => void;
  isGoogleCalendarConnected: boolean;
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


const AssistantChat: React.FC<AssistantChatProps> = ({ onClose, initialImage, initialText, initialAction, onAddTask, onAddEvent, isGoogleCalendarConnected }) => {
  const [messages, setMessages] = useState<Message[]>([{ text: 'Hola, ¿cómo puedo ayudarte a organizar tu día?', isUser: false }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecordingReminder, setIsRecordingReminder] = useState(false);
  const [pendingVoiceReminder, setPendingVoiceReminder] = useState<string | null>(null);

  const sessionPromise = useRef<Promise<LiveSession> | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  
  const outputAudioContext = useRef<AudioContext | null>(null);
  const nextStartTime = useRef(0);
  const audioSources = useRef(new Set<AudioBufferSourceNode>());
  const currentInputTranscriptionRef = useRef('');
  const toolCalledThisTurn = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialAction === 'startListening') {
      const timer = setTimeout(() => {
        handleLiveToggle();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialAction]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const processImage = async () => {
      if (initialImage) {
        setIsLoading(true);
        setMessages(prev => [...prev, { text: "Analizando tu captura de pantalla...", isUser: false }]);
        
        const event = await getEventFromImage(initialImage.base64, initialImage.mimeType);
        
        if (event && event.title && event.date && event.category) {
            onAddEvent(event);
            const eventMessage : Message = {
                text: `He creado un evento llamado "${event.title}" para el ${event.date} a las ${event.time || 'hora no especificada'}.`,
                isUser: false,
            };
            setMessages(prev => [...prev, eventMessage]);
        } else {
            setMessages(prev => [...prev, { text: "No he podido encontrar un evento en la imagen. ¿Puedes darme más detalles?", isUser: false }]);
        }
        setIsLoading(false);
      }
    };
    processImage();
  }, [initialImage, onAddEvent]);

  useEffect(() => {
    const processText = async () => {
        if (initialText) {
            const userMessage: Message = { text: `Reenviaste: "${initialText}"`, isUser: true };
            setMessages(prev => [...prev, userMessage]);
            await processUserInput(initialText);
        }
    };
    processText();
  }, [initialText]);

  const processUserInput = async (text: string) => {
    setIsLoading(true);

    if (pendingVoiceReminder) {
        const eventData = await parseTextToEvent(text);
        if (eventData && eventData.date) {
            onAddEvent({
                title: 'Recordatorio de voz',
                date: eventData.date,
                time: eventData.time,
                category: eventData.category || 'Personal',
                audio: pendingVoiceReminder,
            });
            setMessages(prev => [...prev, {
                text: `¡Hecho! He programado tu recordatorio de voz para el ${eventData.date}${eventData.time ? ` a las ${eventData.time}` : ''}.`,
                isUser: false,
            }]);
            setPendingVoiceReminder(null);
        } else {
            setMessages(prev => [...prev, {
                text: "No he entendido la fecha y hora. ¿Puedes intentarlo de nuevo? Por ejemplo: 'mañana a las 10am'.",
                isUser: false,
            }]);
        }
        setIsLoading(false);
        return;
    }

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

    const handleToggleReminderRecording = async () => {
        if (isRecordingReminder) {
            mediaRecorderRef.current?.stop();
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = event => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        const base64Audio = reader.result as string;
                        setPendingVoiceReminder(base64Audio);

                        setMessages(prev => [
                            ...prev,
                            { text: 'Recordatorio de voz grabado.', isUser: true, audioUrl },
                            { text: '¡Genial! He guardado tu recordatorio. ¿Para qué fecha y hora lo programo?', isUser: false }
                        ]);
                    };
                    stream.getTracks().forEach(track => track.stop());
                };
                
                mediaRecorderRef.current.start();
                setIsRecordingReminder(true);
            } catch (error) {
                console.error("Error accessing microphone for reminder:", error);
                setMessages(prev => [...prev, { text: "No pude acceder al micrófono. Por favor, revisa los permisos.", isUser: false }]);
            }
        }
    };
    
    useEffect(() => {
        if (mediaRecorderRef.current?.state === 'recording' && !isRecordingReminder) {
            mediaRecorderRef.current.stop();
        }
    }, [isRecordingReminder]);


  const handleLiveToggle = async () => {
    if (isLive) {
        // Stop session
        if (sessionPromise.current) {
            sessionPromise.current.then(session => session.close());
            sessionPromise.current = null;
        }
        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach(track => track.stop());
            mediaStream.current = null;
        }
        if (scriptProcessor.current) {
            scriptProcessor.current.disconnect();
            scriptProcessor.current = null;
        }
        if (audioContext.current && audioContext.current.state !== 'closed') {
            audioContext.current.close();
            audioContext.current = null;
        }
        if (outputAudioContext.current && outputAudioContext.current.state !== 'closed') {
            outputAudioContext.current.close();
            outputAudioContext.current = null;
        }
        audioSources.current.forEach(source => source.stop());
        audioSources.current.clear();
        nextStartTime.current = 0;
        setIsLive(false);
        setIsConnecting(false);

    } else {
        // Start session
        setIsConnecting(true);
        setMessages(prev => [...prev, { text: "Iniciando asistente de voz...", isUser: false, isTranscription: true }]);
        
        outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        sessionPromise.current = connectLiveAssistant({
            onopen: async () => {
                console.log('Live session opened');
                setIsLive(true);
                setIsConnecting(false);
                setMessages(prev => [...prev, { text: "Conectado. ¡Habla ahora!", isUser: false, isTranscription: true }]);
                
                // Start microphone input
                try {
                    mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = audioContext.current.createMediaStreamSource(mediaStream.current);
                    scriptProcessor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

                    scriptProcessor.current.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        if (sessionPromise.current) {
                            sessionPromise.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    source.connect(scriptProcessor.current);
                    scriptProcessor.current.connect(audioContext.current.destination);

                } catch (err) {
                    console.error("Microphone access denied:", err);
                    setMessages(prev => [...prev, { text: "Error: Se necesita acceso al micrófono.", isUser: false, isTranscription: true }]);
                    setIsConnecting(false);
                }
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.toolCall) {
                    for (const fc of message.toolCall.functionCalls) {
                        if (fc.name === 'addTask' && fc.args) {
                            toolCalledThisTurn.current = true;
                            const task = fc.args.task as string;
                            const list = fc.args.list as string;

                            if (task && list) {
                                onAddTask({ text: task, list: list });
                                if (sessionPromise.current) {
                                    sessionPromise.current.then((session) => {
                                        session.sendToolResponse({
                                            functionResponses: {
                                                id: fc.id,
                                                name: fc.name,
                                                response: { result: `Tarea "${task}" añadida a la lista "${list}".` },
                                            }
                                        });
                                    });
                                }
                            }
                        }
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

                if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    currentInputTranscriptionRef.current = text;
                    setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage?.isUser && lastMessage.isTranscription) {
                            return [...prev.slice(0, -1), { ...lastMessage, text: text }];
                        }
                        return [...prev, { text, isUser: true, isTranscription: true }];
                    });
                }
                 if (message.serverContent?.outputTranscription) {
                    const text = message.serverContent.outputTranscription.text;
                     setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage && !lastMessage.isUser && lastMessage.isTranscription) {
                            return [...prev.slice(0, -1), { ...lastMessage, text: text }];
                        }
                        return [...prev, { text, isUser: false, isTranscription: true }];
                    });
                }
                if(message.serverContent?.turnComplete) {
                    const textToParse = currentInputTranscriptionRef.current;
                    currentInputTranscriptionRef.current = '';
                    setMessages(prev => prev.map(m => ({...m, isTranscription: false})));

                    if (!toolCalledThisTurn.current && textToParse.trim()) {
                      await processUserInput(textToParse);
                    }
                    toolCalledThisTurn.current = false;
                }
            },
            onerror: (e) => {
                console.error('Live session error:', e);
                setMessages(prev => [...prev, { text: "Error de conexión. Intenta de nuevo.", isUser: false, isTranscription: true }]);
                handleLiveToggle(); // Attempt to stop and clean up
            },
            onclose: () => {
                console.log('Live session closed');
                setIsLive(false);
                setIsConnecting(false);
            }
        });
    }
  };


  return (
    <div className="fixed inset-0 bg-momflow-cream z-50 flex flex-col font-sans">
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <h2 className="text-xl font-bold text-momflow-text-dark">Asistente MomFlow</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.isUser ? 'bg-momflow-lavender text-momflow-text-dark rounded-br-none' : 'bg-white text-momflow-text-dark rounded-bl-none'} ${msg.isTranscription && 'opacity-70 italic'}`}>
              {msg.audioUrl ? (
                  <div className="space-y-2">
                    <p className="font-semibold">{msg.text}</p>
                    <audio controls src={msg.audioUrl} className="w-full h-10"></audio>
                  </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl bg-white text-momflow-text-dark rounded-bl-none">
                    <LoadingIcon className="w-5 h-5 animate-spin" />
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
           <button 
             onClick={handleLiveToggle} 
             className={`p-3 rounded-full transition-colors ${isLive ? 'bg-red-500 text-white' : 'bg-momflow-lavender text-momflow-text-dark'}`}
             disabled={isConnecting || isLoading || isRecordingReminder}
           >
             {isConnecting ? <LoadingIcon className="w-6 h-6 animate-spin"/> : isLive ? <StopIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
           </button>
           <button 
                onClick={handleToggleReminderRecording}
                className={`p-3 rounded-full transition-colors ${isRecordingReminder ? 'bg-red-500 text-white' : 'bg-momflow-lavender text-momflow-text-dark'}`}
                disabled={isConnecting || isLoading || isLive}
            >
                {isRecordingReminder ? <StopIcon className="w-6 h-6" /> : <VoiceMemoIcon className="w-6 h-6" />}
            </button>
           <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe un mensaje o usa el micro..."
            className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-momflow-lavender-dark"
            disabled={isLoading || isLive || isRecordingReminder}
          />
          <button onClick={handleSend} disabled={isLoading || isLive || isRecordingReminder || !input.trim()} className="bg-momflow-coral text-white p-3 rounded-full disabled:bg-gray-300">
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantChat;