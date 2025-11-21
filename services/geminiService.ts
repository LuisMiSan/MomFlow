
// FIX: Import Modality and LiveServerMessage for use in connectLiveAssistant.
import { GoogleGenAI, LiveSession, Type, Modality, LiveServerMessage, FunctionDeclaration } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const chatModel = ai.chats.create({ model: 'gemini-2.5-flash' });

export const sendMessageToGemini = async (message: string) => {
  try {
    const response = await chatModel.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "Lo siento, ha ocurrido un error. Inténtalo de nuevo.";
  }
};

export const getEmpatheticMessage = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Escribe un mensaje corto, empático y motivador para una madre ocupada. Debe ser amigable y alentador, como una pequeña nota de apoyo. En español."
        });
        return response.text;
    } catch(e) {
        console.error("Error fetching empathetic message:", e);
        return "Recuerda tomarte un momento para ti hoy. ¡Lo estás haciendo genial! ✨";
    }
};

const eventSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'El título del evento.' },
        date: { type: Type.STRING, description: 'La fecha del evento en formato YYYY-MM-DD.' },
        time: { type: Type.STRING, description: 'La hora del evento en formato HH:MM.' },
        category: { 
            type: Type.STRING, 
            description: 'La categoría del evento. Debe ser una de: Hijos, Trabajo, Hogar, Personal, Otro.' 
        },
    },
    required: ['title', 'date', 'time', 'category']
};

export const parseTextToEvent = async (text: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analiza el siguiente texto y extrae la información para crear un evento de calendario. El texto es: "${text}".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: eventSchema
            }
        });
        return JSON.parse(response.text);
    } catch(e) {
        console.error("Error parsing event:", e);
        return null;
    }
};

const taskSchema = {
    type: Type.OBJECT,
    properties: {
        task: { type: Type.STRING, description: 'La descripción de la tarea a añadir.' },
        list: { 
            type: Type.STRING, 
            description: 'El nombre de la lista a la que pertenece la tarea. Por ejemplo: Supermercado, Hijos, Hogar, Personal, Trabajo.' 
        },
    },
    required: ['task', 'list']
};

export const parseTextToTask = async (text: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analiza el siguiente texto y extrae la tarea y la lista correspondiente. El texto es: "${text}". Si el usuario no especifica una lista, usa "General". Las listas posibles son "Supermercado", "Pendientes Hijos", "Hogar". Si la lista mencionada se parece a una de estas, usa la de la lista.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: taskSchema
            }
        });
        return JSON.parse(response.text);
    } catch(e) {
        console.error("Error parsing task:", e);
        return null;
    }
};


export const getEventFromImage = async (base64Image: string, mimeType: string) => {
    try {
        const imagePart = {
            inlineData: { data: base64Image, mimeType },
        };
        const textPart = {
            text: "Realiza un OCR en esta imagen y extrae la información para crear un evento de calendario. Identifica el título, la fecha, la hora y asigna la categoría más apropiada. Si falta alguna información, déjala como un string vacío.",
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: eventSchema,
            },
        });
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Error getting event from image:", e);
        return null;
    }
}

const addTaskFunctionDeclaration: FunctionDeclaration = {
    name: 'addTask',
    description: 'Añade una tarea a una lista de tareas específica.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            task: {
                type: Type.STRING,
                description: 'La descripción de la tarea. Por ejemplo: "comprar leche".'
            },
            list: {
                type: Type.STRING,
                description: 'El nombre de la lista a la que se debe añadir la tarea. Por ejemplo: "Supermercado".'
            }
        },
        required: ['task', 'list']
    }
};

const addContactFunctionDeclaration: FunctionDeclaration = {
    name: 'addContact',
    description: 'Añade un contacto nuevo a la lista de contactos.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: 'El nombre completo del contacto.'
            },
            relation: {
                type: Type.STRING,
                description: 'La relación con el contacto. Por ejemplo: "Pediatra", "Colegio", "Familia".'
            },
            phone: {
                type: Type.STRING,
                description: 'El número de teléfono del contacto.'
            },
            notes: {
                type: Type.STRING,
                description: 'Notas adicionales sobre el contacto (opcional).'
            }
        },
        required: ['name', 'relation', 'phone']
    }
};


// FIX: Updated callback types for better type safety and corrected responseModalities to use Modality.AUDIO enum.
export const connectLiveAssistant = (callbacks: {
    onopen: () => void,
    onmessage: (message: LiveServerMessage) => void,
    onerror: (e: ErrorEvent) => void,
    onclose: (e: CloseEvent) => void
}): Promise<LiveSession> => {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            tools: [{ functionDeclarations: [addTaskFunctionDeclaration, addContactFunctionDeclaration] }],
            systemInstruction: 'Eres LINA, una asistente personal amigable, empática e increíblemente eficiente. Tu objetivo es ayudar al usuario a organizar su vida. Responde en español de forma concisa y útil. Cuando el usuario te pida añadir una tarea o un contacto, utiliza las funciones `addTask` o `addContact` que tienes disponibles. No pidas confirmación antes de usar la función, simplemente úsala con la información que te den. Después de que la función se ejecute, confirma al usuario que la acción se ha completado.',
        },
    });
};

export const getWellbeingTip = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Genera un consejo de autocuidado breve y práctico para una madre ocupada. Debe ser algo que pueda hacer en menos de 15 minutos. El tono debe ser cálido y alentador. En español."
        });
        return response.text;
    } catch(e) {
        console.error("Error fetching wellbeing tip:", e);
        return "Tómate 5 minutos para estirar o simplemente respirar profundamente. Te lo mereces.";
    }
};