
import React, { useState, useEffect, useMemo } from 'react';
import LinaChatScreen from './components/AssistantChat';
import { XMarkIcon } from './components/Icons';
import CalendarScreen from './components/CalendarScreen';
import WellbeingScreen from './components/WellbeingScreen';
import SettingsScreen from './components/SettingsScreen';
import TasksScreen from './components/TasksScreen';
import ContactsScreen from './components/ContactsScreen';
import ShoppingScreen from './components/ShoppingScreen';
import MealPlannerScreen from './components/MealPlannerScreen';
import Dashboard from './components/Dashboard';
import { TaskList, Event, CategoryConfig, Contact, FamilyProfile } from './types';
import { LanguageProvider, useLanguage } from './translations';

type Screen = 'calendar' | 'tasks' | 'wellbeing' | 'contacts' | 'shopping' | 'settings' | 'meals';

const initialTaskLists: TaskList[] = [
  {
    id: '1',
    name: 'Supermercado',
    icon: '🛒',
    tasks: [
      { id: 't1-1', text: 'Leche', completed: true },
      { id: 't1-2', text: 'Huevos', completed: false },
      { id: 't1-3', text: 'Pan integral', completed: false },
    ],
  },
  {
    id: '2',
    name: 'Pendientes Hijos',
    icon: '👶',
    tasks: [
      { id: 't2-1', text: 'Confirmar cita pediatra', completed: false },
      { 
        id: 't2-2', 
        text: 'Comprar regalo para cumpleaños de Sofía', 
        completed: false,
        subtasks: [
            { id: 'st2-2-1', text: 'Decidir qué comprar', completed: true },
            { id: 'st2-2-2', text: 'Ir a la tienda de juguetes', completed: true },
            { id: 'st2-2-3', text: 'Envolver el regalo', completed: false },
        ]
      },
    ],
  },
];

const initialContacts: Contact[] = [
    { id: 'c-1', name: 'Dr. López', relation: 'Pediatra', phone: '912 345 678', notes: 'Centro de Salud Central' },
    { id: 'c-2', name: 'Colegio Sol', relation: 'Colegio', phone: '911 223 344', notes: 'Preguntar por la tutora Ana.' },
];

const DEFAULT_CATEGORY_CONFIGS: CategoryConfig[] = [
    { id: 'cat-1', name: 'Hijos', color: '#82ca9d', deletable: false },
    { id: 'cat-2', name: 'Trabajo', color: '#8884d8', deletable: false },
    { id: 'cat-3', name: 'Hogar', color: '#ffc658', deletable: false },
    { id: 'cat-4', name: 'Personal', color: '#ff8042', deletable: false },
    { id: 'cat-5', name: 'Otro', color: '#d1d5db', deletable: false },
];

const initialFamilyProfile: FamilyProfile = {
    name: 'Mi Familia',
    photoUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop',
    timezone: 'GMT-7 America/Los_Angeles',
    members: [
        { id: 'm1', name: 'Mamá', color: '#ff8042' }, 
        { id: 'm2', name: 'Papá', color: '#ffc658' },
        { id: 'm3', name: 'Hijo', color: '#8884d8' } 
    ]
};

const createMockEvents = (source: 'momflow' | 'google'): Event[] => {
    const today = new Date();
    
    // Assign mock member IDs roughly to test filtering
    const MOMFLOW_TEMPLATES: Omit<Event, 'id' | 'date' | 'source'>[] = [
      { title: 'Clase de Yoga', category: 'Personal', time: '07:00 PM', reminder: '1h', recurring: 'weekly', memberId: 'm3' }, // Sarah
      { title: 'Supermercado', category: 'Hogar', recurring: 'weekly', memberId: 'm1' }, // Kevin
      { title: 'Partido de Fútbol', category: 'Hijos', time: '04:00 PM', memberId: 'm2' }, // Jason
    ];

    const GOOGLE_TEMPLATES: Omit<Event, 'id' | 'date' | 'source'>[] = [
        { title: 'Reunión de equipo', category: 'Trabajo', time: '10:00 AM', reminder: '15m', recurring: 'none', memberId: 'm1' }, // Kevin
        { title: 'Entrega proyecto', category: 'Trabajo', time: '05:00 PM', memberId: 'm3' }, // Sarah
    ];
    
    const templates = source === 'momflow' ? MOMFLOW_TEMPLATES : GOOGLE_TEMPLATES;
    const idPrefix = source === 'momflow' ? 'mf' : 'gg';

    const getDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return templates.map((event, i) => {
        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() + (i - 1 + (source === 'google' ? 1 : 0) ));
        return { ...event, id: `${idPrefix}-${i + 1}`, date: getDateString(eventDate), source: source, reminder: event.reminder || 'none', recurring: event.recurring || 'none' };
    });
};

const initialMomFlowEvents = createMockEvents('momflow');
const mockGoogleEvents = createMockEvents('google');

// Inner App Component to consume Language Context
const AppContent: React.FC = () => {
  const [modalScreen, setModalScreen] = useState<Screen | null>(null);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [taskLists, setTaskLists] = useState<TaskList[]>(initialTaskLists);
  const [momFlowEvents, setMomFlowEvents] = useState<Event[]>(initialMomFlowEvents);
  
  const { t } = useLanguage();

  const [familyProfile, setFamilyProfile] = useState<FamilyProfile>(() => {
      try {
          const storedProfile = localStorage.getItem('familyflow-profile');
          return storedProfile ? JSON.parse(storedProfile) : initialFamilyProfile;
      } catch {
          return initialFamilyProfile;
      }
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const storedContacts = localStorage.getItem('familyflow-contacts');
      return storedContacts ? JSON.parse(storedContacts) : initialContacts;
    } catch (error) {
      console.error("Error loading contacts from localStorage:", error);
      return initialContacts;
    }
  });
  
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>(() => {
    try {
        const storedCategories = localStorage.getItem('familyflow-categories');
        return storedCategories ? JSON.parse(storedCategories) : DEFAULT_CATEGORY_CONFIGS;
    } catch (error) {
        console.error("Error loading categories from localStorage:", error);
        return DEFAULT_CATEGORY_CONFIGS;
    }
  });

  const displayedEvents = useMemo(() => {
    const googleEvents = isGoogleCalendarConnected ? mockGoogleEvents : [];
    return [...momFlowEvents, ...googleEvents].sort((a,b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [momFlowEvents, isGoogleCalendarConnected]);

  useEffect(() => {
    try {
        localStorage.setItem('familyflow-categories', JSON.stringify(categoryConfigs));
    } catch (error) {
        console.error("Error saving categories to localStorage:", error);
    }
  }, [categoryConfigs]);

  useEffect(() => {
    try {
      localStorage.setItem('familyflow-contacts', JSON.stringify(contacts));
    } catch (error) {
      console.error("Error saving contacts to localStorage:", error);
    }
  }, [contacts]);
  
  useEffect(() => {
      localStorage.setItem('familyflow-profile', JSON.stringify(familyProfile));
  }, [familyProfile]);

  const handleAddTask = ({ text, list }: { text: string; list: string }) => {
    setTaskLists(prevLists => {
      const listNameNormalized = list.trim().toLowerCase();
      let listExists = false;
  
      const updatedLists = prevLists.map(taskList => {
        if (taskList.name.toLowerCase() === listNameNormalized) {
          listExists = true;
          return {
            ...taskList,
            tasks: [...taskList.tasks, { id: `t-${Date.now()}`, text, completed: false }]
          };
        }
        return taskList;
      });
  
      if (listExists) {
        return updatedLists;
      } else {
        return [
          ...prevLists,
          {
            id: `l-${Date.now()}`,
            name: list.trim(),
            icon: '📋',
            tasks: [{ id: `t-${Date.now()}`, text, completed: false }]
          }
        ];
      }
    });
  };
  
  const handleAddEvent = (eventData: Omit<Event, 'id' | 'source' | 'reminder' | 'recurring'>) => {
    const newEvent: Event = {
        ...eventData,
        id: `mf-${Date.now()}`,
        source: 'momflow',
        reminder: 'none',
        recurring: 'none',
    };
    setMomFlowEvents(prevEvents => [...prevEvents, newEvent]);
  };
  
  const handleAddContact = (contactData: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
        ...contactData,
        id: `c-${Date.now()}`
    };
    setContacts(prev => [...prev, newContact]);
  };

  const handleToggleWhatsApp = () => {
    const newStatus = !isWhatsAppConnected;
    setIsWhatsAppConnected(newStatus);
    localStorage.setItem('isWhatsAppConnected', String(newStatus));
  };
  
  const handleToggleGoogleCalendar = () => {
      const newStatus = !isGoogleCalendarConnected;
      setIsGoogleCalendarConnected(newStatus);
      localStorage.setItem('isGoogleCalendarConnected', String(newStatus));
  };

  // Helper to translate screen names for header
  const getScreenTitle = (screen: Screen) => {
      switch(screen) {
          case 'wellbeing': return t.nav.wellbeing;
          case 'calendar': return t.nav.calendar;
          case 'tasks': return t.nav.tasks;
          case 'contacts': return t.nav.contacts;
          case 'shopping': return t.nav.shopping;
          case 'settings': return t.nav.settings;
          case 'meals': return t.nav.meals;
          default: return screen;
      }
  };

  const renderContent = (activeScreen: Screen | null) => {
    switch (activeScreen) {
      case 'calendar':
        return <CalendarScreen 
            events={displayedEvents} 
            setEvents={setMomFlowEvents} 
            categoryConfigs={categoryConfigs} 
            onClearInitialDate={() => {}} 
            familyProfile={familyProfile}
        />;
      case 'tasks':
        return <TasksScreen taskLists={taskLists} setTaskLists={setTaskLists} onVoiceAddTask={() => {}} />;
      case 'contacts':
        return <ContactsScreen contacts={contacts} setContacts={setContacts} />;
      case 'settings':
        return <SettingsScreen 
                            isWhatsAppConnected={isWhatsAppConnected} 
                            onToggleWhatsApp={handleToggleWhatsApp} 
                            isGoogleCalendarConnected={isGoogleCalendarConnected} 
                            onToggleGoogleCalendar={handleToggleGoogleCalendar}
                            categoryConfigs={categoryConfigs}
                            setCategoryConfigs={setCategoryConfigs}
                            setEvents={setMomFlowEvents}
                            familyProfile={familyProfile}
                            setFamilyProfile={setFamilyProfile}
                         />;
      case 'shopping':
          return <ShoppingScreen />;
      case 'wellbeing':
          return <WellbeingScreen categoryConfigs={categoryConfigs} events={displayedEvents} />;
      case 'meals':
          return <MealPlannerScreen />;
      default:
        return <Dashboard events={displayedEvents} categoryConfigs={categoryConfigs} onNavigateToCalendar={() => setModalScreen('calendar')} />;
    }
  };

  return (
    <div className="h-screen w-full bg-momflow-cream flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <div className={`w-full md:w-[400px] flex-shrink-0 h-full relative z-20 shadow-2xl transition-all duration-300 ${modalScreen ? 'hidden md:block' : 'block'}`}>
          <LinaChatScreen
            onNavigate={setModalScreen}
            onAddTask={handleAddTask}
            onAddEvent={handleAddEvent}
            onAddContact={handleAddContact}
            isGoogleCalendarConnected={isGoogleCalendarConnected}
            familyProfile={familyProfile}
          />
      </div>

      {/* RIGHT CONTENT AREA */}
      <main className={`flex-grow bg-gray-50 h-full overflow-hidden relative ${!modalScreen ? 'hidden md:block' : 'block'}`}>
        
        {/* Desktop Container */}
        <div className="hidden md:flex flex-col h-full w-full">
            <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
                {renderContent(modalScreen)}
            </div>
        </div>

        {/* Mobile Modal Container */}
        <div className="md:hidden absolute inset-0 bg-momflow-cream z-50 flex flex-col animate-slide-in-up overflow-hidden">
            <style>{`
                @keyframes slide-in-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-in-up { animation: slide-in-up 0.3s ease-out forwards; }
            `}</style>
             
             {/* Custom Header for Mobile */}
             {modalScreen && modalScreen !== 'settings' && modalScreen !== 'meals' && (
                <header className="flex items-center justify-between p-2 bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-momflow-text-dark capitalize ml-2">
                        {getScreenTitle(modalScreen)}
                    </h2>
                    <button onClick={() => setModalScreen(null)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
            )}

             {/* Close button for fullscreen mobile modals */}
             {modalScreen && (modalScreen === 'settings' || modalScreen === 'meals') && (
                 <button onClick={() => setModalScreen(null)} className="absolute top-4 right-4 z-20 bg-white/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/80 transition-all shadow-lg hover:text-gray-800">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            )}

            <div className={`flex-grow overflow-y-auto ${modalScreen === 'settings' || modalScreen === 'meals' ? 'p-0' : 'p-4'}`}>
                {renderContent(modalScreen)}
            </div>
        </div>

      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
};

export default App;
