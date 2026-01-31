
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Language = 'es' | 'en';

type Translations = {
    common: {
        loading: string;
        add: string;
        cancel: string;
        save: string;
        delete: string;
        edit: string;
        view: string;
        error: string;
        today: string;
    };
    nav: {
        calendar: string;
        tasks: string;
        meals: string;
        contacts: string;
        wellbeing: string;
        shopping: string;
        settings: string;
    };
    dashboard: {
        greeting: string;
        subtitle: string;
        upcomingEvents: string;
        noEvents: string;
        messageTitle: string;
    };
    calendar: {
        month: string;
        week: string;
        day: string;
        dayEvents: string;
        noEventsDay: string;
        allMembers: string;
        allCategories: string;
        postpone: string;
        reminders: string;
        repeat: string;
    };
    tasks: {
        title: string;
        subtitle: string;
        empty: string;
        addSubtask: string;
    };
    contacts: {
        title: string;
        subtitle: string;
        empty: string;
        addTitle: string;
        editTitle: string;
        name: string;
        relation: string;
        phone: string;
        notes: string;
        confirmDelete: string;
    };
    wellbeing: {
        title: string;
        subtitle: string;
        moodTitle: string;
        moodThanks: string;
        selfCareTitle: string;
        noSelfCare: string;
        balanceTitle: string;
        tipTitle: string;
        generating: string;
    };
    shopping: {
        title: string;
        subtitle: string;
    };
    mealPlanner: {
        title: string;
        subtitle: string;
        tabRecipes: string;
        tabPlanner: string;
        searchPlaceholder: string;
        filterFamily: string;
        filterTop: string;
        filterQuick: string;
        selectTitle: string;
        addRecipe: string;
        breakfast: string;
        lunch: string;
        dinner: string;
        addedMsg: string;
    };
    settings: {
        familyName: string;
        members: string;
        addMember: string;
        theme: string;
        integrations: string;
        language: string;
        photoSizeError: string;
        deleteMemberConfirm: string;
    };
    assistant: {
        intro: string;
        inputPlaceholder: string;
        micAccessError: string;
        connectionError: string;
    };
};

const dictionary: Record<Language, Translations> = {
    es: {
        common: {
            loading: 'Cargando...',
            add: 'Añadir',
            cancel: 'Cancelar',
            save: 'Guardar',
            delete: 'Eliminar',
            edit: 'Editar',
            view: 'Ver',
            error: 'Error',
            today: 'Hoy'
        },
        nav: {
            calendar: 'Calendario',
            tasks: 'Tareas',
            meals: 'Comidas',
            contacts: 'Contactos',
            wellbeing: 'Bienestar',
            shopping: 'Compras',
            settings: 'Ajustes'
        },
        dashboard: {
            greeting: 'Hola, Mamá',
            subtitle: 'Aquí tienes un resumen de tu día.',
            upcomingEvents: 'Próximos Eventos',
            noEvents: 'No tienes eventos para hoy. ¡Disfruta!',
            messageTitle: 'Un Mensaje Para Ti'
        },
        calendar: {
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            dayEvents: 'Eventos del día',
            noEventsDay: 'No hay eventos este día.',
            allMembers: 'Todos',
            allCategories: 'Todas',
            postpone: 'Posponer Evento',
            reminders: 'Recordatorio',
            repeat: 'Repetir'
        },
        tasks: {
            title: 'Mis Tareas',
            subtitle: 'Organiza tus pendientes y libera tu mente.',
            empty: 'No tienes ninguna lista de tareas.',
            addSubtask: 'Añadir subtarea...'
        },
        contacts: {
            title: 'Contactos',
            subtitle: 'Tu agenda de confianza a mano.',
            empty: 'Tu listín está vacío.',
            addTitle: 'Añadir Contacto',
            editTitle: 'Editar Contacto',
            name: 'Nombre',
            relation: 'Relación',
            phone: 'Teléfono',
            notes: 'Notas',
            confirmDelete: '¿Estás segura de que quieres eliminar este contacto?'
        },
        wellbeing: {
            title: 'Panel de Bienestar',
            subtitle: 'Tu espacio para conectar contigo misma.',
            moodTitle: '¿Cómo te sientes hoy?',
            moodThanks: '¡Gracias por compartir cómo te sientes!',
            selfCareTitle: 'Mi Cuidado y Salud',
            noSelfCare: 'No tienes eventos de autocuidado próximos.',
            balanceTitle: 'Balance Semanal',
            tipTitle: 'Tu Momento de Autocuidado',
            generating: 'Generando un consejo para ti...'
        },
        shopping: {
            title: 'Compras',
            subtitle: 'Acceso rápido a tus tiendas favoritas.'
        },
        mealPlanner: {
            title: 'Planifica tu menú semanal',
            subtitle: 'con solo unos toques',
            tabRecipes: 'Recetas',
            tabPlanner: 'Planificador',
            searchPlaceholder: 'Buscar recetas',
            filterFamily: 'Recetario Familiar',
            filterTop: 'Top 20',
            filterQuick: 'Menos de 45 min',
            selectTitle: 'Seleccionar Recetas',
            addRecipe: 'Añadir nueva receta',
            breakfast: 'Desayuno',
            lunch: 'Comida',
            dinner: 'Cena',
            addedMsg: 'añadido al menú.'
        },
        settings: {
            familyName: 'Nombre de la Familia',
            members: 'Miembros',
            addMember: 'Añadir Miembro',
            theme: 'Tema',
            integrations: 'Integraciones',
            language: 'Idioma / Language',
            photoSizeError: 'La imagen es demasiado grande. Por favor, elige una imagen menor a 2MB.',
            deleteMemberConfirm: '¿Eliminar este miembro?'
        },
        assistant: {
            intro: 'Hola, soy LINA. ¿En qué puedo ayudarte hoy?',
            inputPlaceholder: 'Escribe un mensaje...',
            micAccessError: 'Error: Se necesita acceso al micrófono.',
            connectionError: 'Error de conexión.'
        }
    },
    en: {
        common: {
            loading: 'Loading...',
            add: 'Add',
            cancel: 'Cancel',
            save: 'Save',
            delete: 'Delete',
            edit: 'Edit',
            view: 'View',
            error: 'Error',
            today: 'Today'
        },
        nav: {
            calendar: 'Calendar',
            tasks: 'Tasks',
            meals: 'Meals',
            contacts: 'Contacts',
            wellbeing: 'Wellbeing',
            shopping: 'Shopping',
            settings: 'Settings'
        },
        dashboard: {
            greeting: 'Hello, Mom',
            subtitle: 'Here is a summary of your day.',
            upcomingEvents: 'Upcoming Events',
            noEvents: 'No events for today. Enjoy!',
            messageTitle: 'A Message For You'
        },
        calendar: {
            month: 'Month',
            week: 'Week',
            day: 'Day',
            dayEvents: 'Events of the day',
            noEventsDay: 'No events on this day.',
            allMembers: 'All',
            allCategories: 'All',
            postpone: 'Postpone Event',
            reminders: 'Reminder',
            repeat: 'Repeat'
        },
        tasks: {
            title: 'My Tasks',
            subtitle: 'Organize your to-dos and free your mind.',
            empty: 'You have no task lists yet.',
            addSubtask: 'Add subtask...'
        },
        contacts: {
            title: 'Contacts',
            subtitle: 'Your trusted directory at hand.',
            empty: 'Your contact list is empty.',
            addTitle: 'Add Contact',
            editTitle: 'Edit Contact',
            name: 'Name',
            relation: 'Relation',
            phone: 'Phone',
            notes: 'Notes',
            confirmDelete: 'Are you sure you want to delete this contact?'
        },
        wellbeing: {
            title: 'Wellbeing Panel',
            subtitle: 'Your space to connect with yourself.',
            moodTitle: 'How are you feeling today?',
            moodThanks: 'Thanks for sharing how you feel!',
            selfCareTitle: 'My Care & Health',
            noSelfCare: 'You have no upcoming self-care events.',
            balanceTitle: 'Weekly Balance',
            tipTitle: 'Your Self-Care Moment',
            generating: 'Generating a tip for you...'
        },
        shopping: {
            title: 'Shopping',
            subtitle: 'Quick access to your favorite stores.'
        },
        mealPlanner: {
            title: 'Set the week\'s menu',
            subtitle: 'with just a few taps',
            tabRecipes: 'Recipes',
            tabPlanner: 'Planner',
            searchPlaceholder: 'Search recipes',
            filterFamily: 'Family Recipe Box',
            filterTop: 'Top 20',
            filterQuick: 'Under 45-Min',
            selectTitle: 'Select Recipes',
            addRecipe: 'Add new recipe',
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            addedMsg: 'added to menu.'
        },
        settings: {
            familyName: 'Family Name',
            members: 'Members',
            addMember: 'Add Member',
            theme: 'Theme',
            integrations: 'Integrations',
            language: 'Idioma / Language',
            photoSizeError: 'Image is too large. Please choose an image smaller than 2MB.',
            deleteMemberConfirm: 'Delete this member?'
        },
        assistant: {
            intro: 'Hello, I am LINA. How can I help you today?',
            inputPlaceholder: 'Type a message...',
            micAccessError: 'Error: Microphone access needed.',
            connectionError: 'Connection error.'
        }
    }
};

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('momflow-language');
        return (saved === 'en' || saved === 'es') ? saved : 'es';
    });

    useEffect(() => {
        localStorage.setItem('momflow-language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'es' ? 'en' : 'es');
    };

    const value = {
        language,
        toggleLanguage,
        t: dictionary[language]
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
