
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import AssistantChat from './components/AssistantChat';
import { PlusIcon, MicrophoneIcon, CameraIcon, PencilIcon, XMarkIcon, WhatsAppIcon, ClipboardListIcon, ShoppingBagIcon } from './components/Icons';
import CalendarScreen from './components/CalendarScreen';
import WellbeingScreen from './components/WellbeingScreen';
import SettingsScreen from './components/SettingsScreen';
import TasksScreen from './components/TasksScreen';
import ContactsScreen from './components/ContactsScreen';
import ShoppingScreen from './components/ShoppingScreen';
import { TaskList, Event, Category, CategoryConfig, Contact } from './types';

type Screen = 'dashboard' | 'calendar' | 'tasks' | 'wellbeing' | 'contacts' | 'shopping' | 'settings';

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
            { id: 'st2-2-2', text: 'Ir a la tienda de juguetes', completed: false },
            { id: 'st2-2-3', text: 'Envolver el regalo', completed: false },
        ]
      },
    ],
  },
  {
    id: '3',
    name: 'Hogar',
    icon: '🏠',
    tasks: [
      { id: 't3-1', text: 'Llamar al fontanero', completed: true },
    ],
  },
];

const initialContacts: Contact[] = [
    { id: 'c-1', name: 'Dr. López', relation: 'Pediatra', phone: '912 345 678', notes: 'Centro de Salud Central' },
    { id: 'c-2', name: 'Colegio Sol', relation: 'Colegio', phone: '911 223 344', notes: 'Preguntar por la tutora Ana.' },
    { id: 'c-3', name: 'Abuela María', relation: 'Familia', phone: '612 345 678' },
];

const DEFAULT_CATEGORY_CONFIGS: CategoryConfig[] = [
    { id: 'cat-1', name: 'Hijos', color: '#82ca9d', deletable: false },
    { id: 'cat-2', name: 'Trabajo', color: '#8884d8', deletable: false },
    { id: 'cat-3', name: 'Hogar', color: '#ffc658', deletable: false },
    { id: 'cat-4', name: 'Personal', color: '#ff8042', deletable: false },
    { id: 'cat-5', name: 'Otro', color: '#d1d5db', deletable: false },
];

// Helper to generate dynamic mock events
const createMockEvents = (source: 'momflow' | 'google'): Event[] => {
    const today = new Date();
    
    const MOMFLOW_TEMPLATES: Omit<Event, 'id' | 'date' | 'source'>[] = [
      { title: 'Clase de Yoga', category: 'Personal', time: '07:00 PM', reminder: '1h', recurring: 'weekly' },
      { title: 'Supermercado', category: 'Hogar', recurring: 'weekly' },
      { title: 'Llamar al fontanero', category: 'Hogar', reminder: 'none', recurring: 'none' },
      { 
        title: 'Cumpleaños de Ana', 
        category: 'Hijos',
        subtasks: [
            { id: 'st-ana-1', text: 'Comprar tarta', completed: true },
            { id: 'st-ana-2', text: 'Inflar globos', completed: false },
            { id: 'st-ana-3', text: 'Confirmar invitados', completed: false },
        ]
      },
    ];

    const GOOGLE_TEMPLATES: Omit<Event, 'id' | 'date' | 'source'>[] = [
        { title: 'Reunión de equipo', category: 'Trabajo', time: '10:00 AM', reminder: '15m', recurring: 'none' },
        { title: 'Entrega proyecto', category: 'Trabajo', time: '05:00 PM' },
        { title: 'Noche de cine', category: 'Personal', time: '08:00 PM' },
        // FIX: Removed `date` property which is not allowed in this type.
        { title: 'Recoger a los niños', category: 'Hijos', time: '04:30 PM', reminder: '1h', recurring: 'daily' },
        { title: 'Reunión de padres', category: 'Hijos', time: '06:00 PM', reminder: '1d' },
        { title: 'Dentista (niño)', category: 'Hijos', time: '11:00 AM', reminder: '1d' },
    ];
    
    const templates = source === 'momflow' ? MOMFLOW_TEMPLATES : GOOGLE_TEMPLATES;
    const idPrefix = source === 'momflow' ? 'mf' : 'gg';

    const getDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return templates.map((event, i) => {
        const eventDate = new Date(today);
        // Distribute events around today
        eventDate.setDate(today.getDate() + (i - 2 + (source === 'google' ? 1 : 0) ));
        if (event.title === 'Recoger a los niños') { // Make this one always today
          eventDate.setDate(today.getDate());
        }
        return {
            ...event,
            id: `${idPrefix}-${i + 1}`,
            date: getDateString(eventDate),
            reminder: event.reminder || 'none',
            recurring: event.recurring || 'none',
            source: source,
        };
    });
};

const initialMomFlowEvents = createMockEvents('momflow');
const mockGoogleEvents = createMockEvents('google');


const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [calendarDate, setCalendarDate] = useState<string | undefined>(undefined);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [ocrImage, setOcrImage] = useState<{base64: string, mimeType: string} | null>(null);
  const [forwardedText, setForwardedText] = useState<string | null>(null);
  const [assistantInitialAction, setAssistantInitialAction] = useState<string | null>(null);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [taskLists, setTaskLists] = useState<TaskList[]>(initialTaskLists);
  const [momFlowEvents, setMomFlowEvents] = useState<Event[]>(initialMomFlowEvents);

  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const storedContacts = localStorage.getItem('momflow-contacts');
      return storedContacts ? JSON.parse(storedContacts) : initialContacts;
    } catch (error) {
      console.error("Error loading contacts from localStorage:", error);
      return initialContacts;
    }
  });
  
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>(() => {
    try {
        const storedCategories = localStorage.getItem('momflow-categories');
        return storedCategories ? JSON.parse(storedCategories) : DEFAULT_CATEGORY_CONFIGS;
    } catch (error) {
        console.error("Error loading categories from localStorage:", error);
        return DEFAULT_CATEGORY_CONFIGS;
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const displayedEvents = useMemo(() => {
    const googleEvents = isGoogleCalendarConnected ? mockGoogleEvents : [];
    return [...momFlowEvents, ...googleEvents].sort((a,b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  }, [momFlowEvents, isGoogleCalendarConnected]);

  useEffect(() => {
    const checkStatuses = () => {
      const storedWhatsAppStatus = localStorage.getItem('isWhatsAppConnected');
      setIsWhatsAppConnected(storedWhatsAppStatus === 'true');
      const storedGoogleStatus = localStorage.getItem('isGoogleCalendarConnected');
      setIsGoogleCalendarConnected(storedGoogleStatus === 'true');
    };
    checkStatuses();
    window.addEventListener('focus', checkStatuses);
    return () => window.removeEventListener('focus', checkStatuses);
  }, []);
  
  useEffect(() => {
    try {
        localStorage.setItem('momflow-categories', JSON.stringify(categoryConfigs));
    } catch (error) {
        console.error("Error saving categories to localStorage:", error);
    }
  }, [categoryConfigs]);

  useEffect(() => {
    try {
      localStorage.setItem('momflow-contacts', JSON.stringify(contacts));
    } catch (error) {
      console.error("Error saving contacts to localStorage:", error);
    }
  }, [contacts]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setOcrImage({ base64: base64String, mimeType: file.type });
        setForwardedText(null);
        setIsAssistantOpen(true);
        setFabOpen(false);
      };
      reader.readAsDataURL(file);
    }
    if(event.target) {
        event.target.value = '';
    }
  };

  const openAssistantForOcr = () => {
    fileInputRef.current?.click();
  };

  const openAssistantForWhatsApp = () => {
    setForwardedText("No te olvides de la reunión de padres y maestros mañana a las 5pm en el colegio.");
    setOcrImage(null);
    setIsAssistantOpen(true);
    setFabOpen(false);
  };
  
  const openAssistantForVoiceTask = () => {
    setAssistantInitialAction('startListening');
    setOcrImage(null);
    setForwardedText(null);
    setIsAssistantOpen(true);
    setFabOpen(false);
  };

  const closeAssistant = () => {
    setIsAssistantOpen(false);
    setOcrImage(null);
    setForwardedText(null);
    setAssistantInitialAction(null);
  }

  const handleNavigateToCalendar = (date: string) => {
    setCalendarDate(date);
    setActiveScreen('calendar');
  };

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
            icon: '📋', // Default icon for new lists
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

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard events={displayedEvents} categoryConfigs={categoryConfigs} onNavigateToCalendar={handleNavigateToCalendar} />;
      case 'calendar':
        return <CalendarScreen events={displayedEvents} setEvents={setMomFlowEvents} initialDate={calendarDate} onClearInitialDate={() => setCalendarDate(undefined)} categoryConfigs={categoryConfigs} />;
      case 'tasks':
        return <TasksScreen taskLists={taskLists} setTaskLists={setTaskLists} onVoiceAddTask={openAssistantForVoiceTask} />;
      case 'wellbeing':
        return <WellbeingScreen categoryConfigs={categoryConfigs} />;
      case 'contacts':
        return <ContactsScreen contacts={contacts} setContacts={setContacts} />;
      case 'shopping':
        return <ShoppingScreen />;
      case 'settings':
        return <SettingsScreen 
                  isWhatsAppConnected={isWhatsAppConnected} 
                  onToggleWhatsApp={handleToggleWhatsApp} 
                  isGoogleCalendarConnected={isGoogleCalendarConnected} 
                  onToggleGoogleCalendar={handleToggleGoogleCalendar}
                  categoryConfigs={categoryConfigs}
                  setCategoryConfigs={setCategoryConfigs}
                  setEvents={setMomFlowEvents}
               />;
      default:
        return <Dashboard events={displayedEvents} categoryConfigs={categoryConfigs} onNavigateToCalendar={handleNavigateToCalendar} />;
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased text-momflow-text-dark bg-momflow-cream max-w-lg mx-auto shadow-2xl flex flex-col">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <main className="flex-grow p-4 pb-24">
        {renderScreen()}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-5 max-w-lg mx-auto z-50">
         <div className="relative">
            {fabOpen && (
                <div className="absolute bottom-16 right-0 flex flex-col items-center space-y-3">
                    {isWhatsAppConnected && (
                      <button onClick={openAssistantForWhatsApp} className="bg-white p-3 rounded-full shadow-lg hover:bg-momflow-lavender transition-all">
                          <WhatsAppIcon className="w-6 h-6 text-green-500" />
                      </button>
                    )}
                    <button onClick={openAssistantForOcr} className="bg-white p-3 rounded-full shadow-lg hover:bg-momflow-lavender transition-all">
                        <CameraIcon className="w-6 h-6 text-momflow-text-dark" />
                    </button>
                     <button onClick={() => { setIsAssistantOpen(true); setFabOpen(false); }} className="bg-white p-3 rounded-full shadow-lg hover:bg-momflow-lavender transition-all">
                        <PencilIcon className="w-6 h-6 text-momflow-text-dark" />
                    </button>
                </div>
            )}
            <button
                onClick={() => setFabOpen(!fabOpen)}
                className="bg-momflow-coral text-white p-4 rounded-full shadow-lg hover:bg-red-400 transition-transform transform hover:scale-110"
                style={{ width: '64px', height: '64px' }}
            >
                {fabOpen ? <XMarkIcon className="w-8 h-8" /> : <PlusIcon className="w-8 h-8" />}
            </button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 max-w-lg mx-auto z-40">
        <div className="flex justify-around h-16 items-center">
          <button onClick={() => setActiveScreen('dashboard')} className={`flex flex-col items-center space-y-1 ${activeScreen === 'dashboard' ? 'text-momflow-lavender-dark' : 'text-momflow-text-light'}`}>
            <i className="fa-solid fa-house"></i>
            <span className="text-xs">Inicio</span>
          </button>
          <button onClick={() => setActiveScreen('calendar')} className={`flex flex-col items-center space-y-1 ${activeScreen === 'calendar' ? 'text-momflow-lavender-dark' : 'text-momflow-text-light'}`}>
            <i className="fa-solid fa-calendar-days"></i>
            <span className="text-xs">Calendario</span>
          </button>
          <button onClick={() => setActiveScreen('tasks')} className={`flex flex-col items-center space-y-1 ${activeScreen === 'tasks' ? 'text-momflow-lavender-dark' : 'text-momflow-text-light'}`}>
            <ClipboardListIcon className="w-6 h-6" />
            <span className="text-xs">Tareas</span>
          </button>
          <button onClick={() => setActiveScreen('shopping')} className={`flex flex-col items-center space-y-1 ${activeScreen === 'shopping' ? 'text-momflow-lavender-dark' : 'text-momflow-text-light'}`}>
            <ShoppingBagIcon className="w-6 h-6" />
            <span className="text-xs">Compras</span>
          </button>
           <button onClick={() => setActiveScreen('contacts')} className={`flex flex-col items-center space-y-1 ${activeScreen === 'contacts' ? 'text-momflow-lavender-dark' : 'text-momflow-text-light'}`}>
            <i className="fa-solid fa-address-book"></i>
            <span className="text-xs">Contactos</span>
          </button>
          <button onClick={() => setActiveScreen('wellbeing')} className={`flex flex-col items-center space-y-1 ${activeScreen === 'wellbeing' ? 'text-momflow-lavender-dark' : 'text-momflow-text-light'}`}>
            <i className="fa-solid fa-heart-pulse"></i>
            <span className="text-xs">Bienestar</span>
          </button>
          <button onClick={() => setActiveScreen('settings')} className={`flex flex-col items-center space-y-1 ${activeScreen === 'settings' ? 'text-momflow-lavender-dark' : 'text-momflow-text-light'}`}>
            <i className="fa-solid fa-gear"></i>
            <span className="text-xs">Ajustes</span>
          </button>
        </div>
      </nav>

      {/* Assistant Modal */}
      {isAssistantOpen && (
        <AssistantChat 
          onClose={closeAssistant} 
          initialImage={ocrImage} 
          initialText={forwardedText} 
          initialAction={assistantInitialAction}
          onAddTask={handleAddTask}
          onAddEvent={handleAddEvent}
          isGoogleCalendarConnected={isGoogleCalendarConnected}
        />
      )}
    </div>
  );
};

export default App;