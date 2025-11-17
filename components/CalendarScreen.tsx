
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Event, Category, Task, CategoryConfig } from '../types';
import { XMarkIcon, GoogleIcon, PlusIcon, ClockIcon } from './Icons';

type CalendarView = 'month' | 'week' | 'day';

// Helper function to get the start (Sunday) and end (Saturday) of a week
const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start, end };
};

interface EventPillProps {
    event: Event;
    onClick: () => void;
    color: string;
}

const EventPill: React.FC<EventPillProps> = ({ event, onClick, color }) => {
    const subtaskProgress = useMemo(() => {
        if (!event.subtasks || event.subtasks.length === 0) return null;
        const completed = event.subtasks.filter(st => st.completed).length;
        const total = event.subtasks.length;
        return { completed, total };
    }, [event.subtasks]);

    return (
        <button 
            onClick={onClick} 
            className="w-full text-left p-1.5 rounded-lg hover:bg-opacity-80 transition-all" 
            style={{ backgroundColor: `${color}30` }}
        >
            {/* Top row: Title, icons, and Time */}
            <div className="flex justify-between items-start text-xs">
                <div className="flex items-center space-x-1.5 truncate">
                    {event.source === 'google' && <GoogleIcon className="w-3 h-3 flex-shrink-0" style={{ color }} />}
                    <p className="font-bold truncate" style={{ color }}>{event.title}</p>
                    <div className="flex items-center space-x-1.5 text-gray-500" style={{color: `${color}A0`}}>
                        {event.reminder && event.reminder !== 'none' && <i className="fa-solid fa-bell"></i>}
                        {event.recurring && event.recurring !== 'none' && <i className="fa-solid fa-repeat"></i>}
                    </div>
                </div>
                {event.time && <p className="text-xs font-semibold flex-shrink-0 pl-2" style={{ color: `${color}A0` }}>{event.time}</p>}
            </div>

            {/* Bottom row: Category & Progress */}
            <div className="flex justify-between items-center mt-1 text-[10px]">
                <div 
                    className="px-2 py-0.5 font-bold rounded"
                    style={{ backgroundColor: `${color}40`, color }}
                >
                    {event.category}
                </div>

                {subtaskProgress && subtaskProgress.total > 0 && (
                    <div className="flex items-center space-x-1.5">
                        <div className="w-10 h-1.5 bg-gray-400/40 rounded-full overflow-hidden">
                            <div 
                                className="h-full" 
                                style={{ 
                                    width: `${(subtaskProgress.completed / subtaskProgress.total) * 100}%`,
                                    backgroundColor: color 
                                }}
                            ></div>
                        </div>
                        <span className="font-mono font-semibold" style={{ color: `${color}A0` }}>
                            {subtaskProgress.completed}/{subtaskProgress.total}
                        </span>
                    </div>
                )}
            </div>
        </button>
    );
};


// Helper to parse YYYY-MM-DD string to Date object to avoid timezone issues
const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const reminderOptions: { [key: string]: string } = {
    'none': 'Sin recordatorio',
    '5m': '5 minutos antes',
    '15m': '15 minutos antes',
    '1h': '1 hora antes',
    '1d': '1 día antes'
};

const recurringOptions: { [key: string]: string } = {
    'none': 'No se repite',
    'daily': 'Diariamente',
    'weekly': 'Semanalmente',
    'monthly': 'Mensualmente'
};

interface EventDetailModalProps {
    event: Event;
    onClose: () => void;
    onSave: (event: Event) => void;
    categoryConfigs: CategoryConfig[];
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onSave, categoryConfigs }) => {
    const [editedEvent, setEditedEvent] = useState(event);
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    
    const categoryColorMap = useMemo(() => 
        Object.fromEntries(categoryConfigs.map(c => [c.name, c.color])),
        [categoryConfigs]
    );

    useEffect(() => {
        setEditedEvent(event);
        setIsAddingSubtask(false);
        setNewSubtaskText('');
    }, [event]);

    const isGoogleEvent = editedEvent.source === 'google';

    const handleSave = () => {
        if (isGoogleEvent) return;
        onSave(editedEvent);
        onClose();
    };

    const handleFieldChange = (field: keyof Event, value: any) => {
        setEditedEvent(prev => ({ ...prev, [field]: value }));
    };

    const handleToggleSubtask = (subtaskId: string) => {
        if (isGoogleEvent) return;
        setEditedEvent(prevEvent => ({
            ...prevEvent,
            subtasks: (prevEvent.subtasks || []).map(st => 
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
            )
        }));
    };

    const handleAddNewSubtask = () => {
        if (!newSubtaskText.trim() || isGoogleEvent) {
            setIsAddingSubtask(false);
            setNewSubtaskText('');
            return;
        }
        const newSubtask: Task = {
            id: `sub-${Date.now()}`,
            text: newSubtaskText.trim(),
            completed: false,
        };
        setEditedEvent(prevEvent => ({
            ...prevEvent,
            subtasks: [...(prevEvent.subtasks || []), newSubtask]
        }));
        setIsAddingSubtask(false);
        setNewSubtaskText('');
    };
    
    const handlePostpone = (type: 'hour' | 'day' | 'week') => {
        if (isGoogleEvent) return;

        const newEvent = { ...editedEvent };
        const eventDate = parseDateString(newEvent.date);
        
        const formatYYYYMMDD = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (type === 'hour' && newEvent.time) {
            const [time, modifier] = newEvent.time.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
            
            hours += 1;

            if (hours >= 24) {
                hours -= 24;
                eventDate.setDate(eventDate.getDate() + 1);
            }

            const newModifier = hours >= 12 ? 'PM' : 'AM';
            let displayHours = hours % 12;
            if (displayHours === 0) displayHours = 12;

            newEvent.time = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${newModifier}`;
            newEvent.date = formatYYYYMMDD(eventDate);
        }

        if (type === 'day') {
            eventDate.setDate(eventDate.getDate() + 1);
            newEvent.date = formatYYYYMMDD(eventDate);
        }

        if (type === 'week') {
            eventDate.setDate(eventDate.getDate() + 7);
            newEvent.date = formatYYYYMMDD(eventDate);
        }

        onSave(newEvent);
        onClose();
    };

     const subtaskCompletion = useMemo(() => {
        if (!editedEvent.subtasks || editedEvent.subtasks.length === 0) return null;
        const completed = editedEvent.subtasks.filter(st => st.completed).length;
        const total = editedEvent.subtasks.length;
        return { completed, total };
    }, [editedEvent.subtasks]);

    const formattedDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full' }).format(parseDateString(editedEvent.date));
    const currentCategoryColor = categoryColorMap[editedEvent.category] || '#d1d5db';

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
                <header className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        {isGoogleEvent && <GoogleIcon className="w-4 h-4 text-gray-500" />}
                        <h3 className="text-lg font-bold text-momflow-text-dark">{editedEvent.title}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </header>
                <div className="p-4 space-y-4">
                     {isGoogleEvent && (
                        <div className="bg-blue-50 text-blue-700 p-2 text-xs text-center rounded-lg">
                            Este evento está sincronizado con Google Calendar.
                        </div>
                    )}
                    <div className="text-sm">
                        <p className="font-semibold text-momflow-text-dark">{formattedDate}</p>
                        {editedEvent.time && <p className="text-momflow-text-light">{editedEvent.time}</p>}
                    </div>
                    
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-momflow-text-light mb-1">Categoría</label>
                        <select 
                            id="category" 
                            value={editedEvent.category} 
                            onChange={(e) => handleFieldChange('category', e.target.value)} 
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-momflow-lavender-dark focus:border-momflow-lavender-dark disabled:bg-gray-100 font-semibold"
                            style={{ color: currentCategoryColor, backgroundColor: `${currentCategoryColor}20`}}
                            disabled={isGoogleEvent}
                        >
                            {categoryConfigs.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-momflow-text-light">Subtareas</h4>
                            {subtaskCompletion && (
                                <span className="text-xs font-semibold text-momflow-text-light">
                                    {subtaskCompletion.completed}/{subtaskCompletion.total}
                                </span>
                            )}
                        </div>

                        <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                            {(editedEvent.subtasks || []).map(subtask => (
                                <div key={subtask.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`subtask-${subtask.id}`}
                                        checked={subtask.completed}
                                        onChange={() => handleToggleSubtask(subtask.id)}
                                        disabled={isGoogleEvent}
                                        className="h-4 w-4 rounded border-gray-300 text-momflow-lavender-dark focus:ring-momflow-lavender-dark flex-shrink-0"
                                    />
                                    <label htmlFor={`subtask-${subtask.id}`} className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-momflow-text-dark'}`}>
                                        {subtask.text}
                                    </label>
                                </div>
                            ))}
                        </div>

                        {isAddingSubtask ? (
                            <input
                                type="text"
                                value={newSubtaskText}
                                onChange={e => setNewSubtaskText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddNewSubtask()}
                                onBlur={handleAddNewSubtask}
                                placeholder="Añadir subtarea..."
                                autoFocus
                                className="w-full mt-2 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-momflow-lavender-dark"
                            />
                        ) : (
                            !isGoogleEvent && (
                                <button 
                                    onClick={() => setIsAddingSubtask(true)}
                                    className="text-sm text-momflow-lavender-dark hover:underline mt-1 flex items-center space-x-1"
                                >
                                    <PlusIcon className="w-3 h-3" />
                                    <span>Añadir subtarea</span>
                                </button>
                            )
                        )}
                    </div>

                    <hr className="my-2"/>

                    <div>
                        <h4 className="text-sm font-medium text-momflow-text-light mb-2 flex items-center space-x-1.5">
                            <ClockIcon className="w-4 h-4" />
                            <span>Posponer Evento</span>
                        </h4>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePostpone('hour')}
                                disabled={isGoogleEvent || !editedEvent.time}
                                className="flex-1 text-xs bg-gray-100 text-momflow-text-dark font-semibold py-1.5 px-2 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                +1 hora
                            </button>
                            <button
                                onClick={() => handlePostpone('day')}
                                disabled={isGoogleEvent}
                                className="flex-1 text-xs bg-gray-100 text-momflow-text-dark font-semibold py-1.5 px-2 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Mañana
                            </button>
                            <button
                                onClick={() => handlePostpone('week')}
                                disabled={isGoogleEvent}
                                className="flex-1 text-xs bg-gray-100 text-momflow-text-dark font-semibold py-1.5 px-2 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                +1 semana
                            </button>
                        </div>
                    </div>
                    
                    <hr className="my-2"/>
                    
                    <div>
                        <label htmlFor="reminder" className="block text-sm font-medium text-momflow-text-light mb-1">Recordatorio</label>
                        <select id="reminder" value={editedEvent.reminder || 'none'} onChange={(e) => handleFieldChange('reminder', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-momflow-lavender-dark focus:border-momflow-lavender-dark disabled:bg-gray-100" disabled={!editedEvent.time || isGoogleEvent}>
                            {Object.entries(reminderOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                        </select>
                        {!editedEvent.time && <p className="text-xs text-gray-400 mt-1">Los recordatorios solo están disponibles para eventos con hora.</p>}
                    </div>
                     <div>
                        <label htmlFor="recurring" className="block text-sm font-medium text-momflow-text-light mb-1">Repetir</label>
                        <select id="recurring" value={editedEvent.recurring || 'none'} onChange={(e) => handleFieldChange('recurring', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-momflow-lavender-dark focus:border-momflow-lavender-dark disabled:bg-gray-100" disabled={isGoogleEvent}>
                            {Object.entries(recurringOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                        </select>
                    </div>
                </div>
                <footer className="p-4 bg-gray-50 rounded-b-2xl">
                    <button onClick={handleSave} className="w-full bg-momflow-coral text-white font-bold py-2 px-4 rounded-lg hover:bg-red-400 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" disabled={isGoogleEvent}>
                        {isGoogleEvent ? 'Edita en Google Calendar' : 'Guardar Cambios'}
                    </button>
                </footer>
            </div>
        </div>
    )
}

interface CalendarScreenProps {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  initialDate?: string;
  onClearInitialDate: () => void;
  categoryConfigs: CategoryConfig[];
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ events, setEvents, initialDate, onClearInitialDate, categoryConfigs }) => {
  const [currentDate, setCurrentDate] = useState(initialDate ? parseDateString(initialDate) : new Date());
  const [view, setView] = useState<CalendarView>('day');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const timeoutIdsRef = useRef<Map<string, number>>(new Map());

  const categoryColorMap = useMemo(() => 
    Object.fromEntries(categoryConfigs.map(c => [c.name, c.color])),
    [categoryConfigs]
  );

  // --- Reminder Logic ---
    const parseTime = (timeString?: string): { hours: number, minutes: number } | null => {
        if (!timeString) return null;
        const [time, modifier] = timeString.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (hours === 12) {
            hours = modifier.toUpperCase() === 'AM' ? 0 : 12;
        } else if (modifier.toUpperCase() === 'PM') {
            hours += 12;
        }
        return { hours, minutes };
    };

    const getReminderDurationMs = (reminder: string): number => {
        if (!reminder || reminder === 'none') return 0;
        const value = parseInt(reminder.slice(0, -1));
        const unit = reminder.slice(-1);
        switch (unit) {
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 0;
        }
    };

    const scheduleReminder = (event: Event) => {
        if (!event.reminder || event.reminder === 'none' || !event.time) return;

        const eventDate = parseDateString(event.date);
        const time = parseTime(event.time);
        if (time) {
            eventDate.setHours(time.hours, time.minutes, 0, 0);
        }

        const reminderTime = eventDate.getTime() - getReminderDurationMs(event.reminder);
        const delay = reminderTime - Date.now();

        if (delay > 0) {
            const timeoutId = window.setTimeout(() => {
                alert(`Recordatorio: ${event.title} a las ${event.time}`);
                timeoutIdsRef.current.delete(event.id);
            }, delay);
            timeoutIdsRef.current.set(event.id, timeoutId);
        }
    };

    const clearReminder = (eventId: string) => {
        if (timeoutIdsRef.current.has(eventId)) {
            clearTimeout(timeoutIdsRef.current.get(eventId)!);
            timeoutIdsRef.current.delete(eventId);
        }
    };

  useEffect(() => {
      if (initialDate) {
          onClearInitialDate();
      }
  }, [initialDate, onClearInitialDate]);

    // Schedule reminders on initial load and manage cleanup
    useEffect(() => {
        events.forEach(scheduleReminder);
        return () => {
            timeoutIdsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        };
    }, []); // Runs only on mount


  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') {
      return events;
    }
    return events.filter(event => event.category === selectedCategory);
  }, [selectedCategory, events]);

  const handleSaveEvent = (updatedEvent: Event) => {
    clearReminder(updatedEvent.id);
    scheduleReminder(updatedEvent);
    setEvents(prevEvents => prevEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const daysOfWeek = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const today = new Date();

  const changeDate = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === 'month') newDate.setMonth(newDate.getMonth() + amount);
      if (view === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
      if (view === 'day') newDate.setDate(newDate.getDate() + amount);
      return newDate;
    });
  };

  const renderHeader = () => {
    let title = '';
    const monthFormat = new Intl.DateTimeFormat('es-ES', { month: 'long' });
    const dayFormat = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    if (view === 'month') {
        title = `${monthFormat.format(currentDate)} ${currentDate.getFullYear()}`;
    } else if (view === 'week') {
        const { start, end } = getWeekRange(currentDate);
        title = `${start.getDate()} ${monthFormat.format(start)} - ${end.getDate()} ${monthFormat.format(end)}`;
    } else { // day view
        title = dayFormat.format(currentDate);
    }

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
          <h2 className="text-xl font-bold text-momflow-text-dark capitalize text-center">{title}</h2>
          <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
        </div>
        <div className="bg-gray-200 p-1 rounded-full flex justify-center space-x-1 text-sm">
          {(['day', 'week', 'month'] as CalendarView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1 rounded-full font-semibold transition-colors ${view === v ? 'bg-white shadow' : 'text-gray-600'}`}
            >
              {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  const renderFilterBar = () => {
    const categories: (Category | 'all')[] = ['all', ...categoryConfigs.map(c => c.name)];
    
    return (
        <div className="flex space-x-2 overflow-x-auto pb-4 -mx-4 px-4 mb-2">
            {categories.map(cat => {
                const isSelected = selectedCategory === cat;
                const baseStyle = "px-3 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors";
                const selectedStyle = `bg-momflow-lavender-dark text-white shadow`;
                const unselectedStyle = "bg-white hover:bg-momflow-lavender text-momflow-text-light";

                return (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`${baseStyle} ${isSelected ? selectedStyle : unselectedStyle}`}
                    >
                        {cat === 'all' ? 'Todas' : cat}
                    </button>
                );
            })}
        </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`pad-start-${i}`} className="border-r border-b border-gray-200"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = date.toDateString() === today.toDateString();
        const dayEvents = filteredEvents.filter(e => e.date === dateString).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        calendarDays.push(
            <div key={dateString} className="border-r border-b border-gray-200 p-1 min-h-[100px] flex flex-col">
                <span className={`text-xs font-semibold self-start ${isToday ? 'bg-momflow-lavender-dark text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                    {day}
                </span>
                <div className="space-y-1 mt-1 overflow-y-auto flex-grow">
                    {dayEvents.slice(0, 3).map(event => <EventPill key={event.id} event={event} onClick={() => setSelectedEvent(event)} color={categoryColorMap[event.category] || '#d1d5db'} />)}
                    {dayEvents.length > 3 && <p className="text-xs text-center text-gray-500 mt-1">+{dayEvents.length - 3} más</p>}
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-7 text-center text-xs font-bold text-momflow-text-light border-t border-r border-l border-gray-200">
                {daysOfWeek.map(day => <div key={day} className="py-2 border-b border-gray-200">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 flex-grow border-l border-gray-200">
                {calendarDays}
            </div>
        </div>
    );
  };

  const renderWeekView = () => {
    const { start } = getWeekRange(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return date;
    });

    return (
        <div className="space-y-3">
            {weekDays.map(date => {
                const year = date.getFullYear();
                const month = date.getMonth();
                const day = date.getDate();
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = date.toDateString() === today.toDateString();
                const dayEvents = filteredEvents.filter(e => e.date === dateString).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
                
                return (
                    <div key={dateString} className={`p-3 rounded-lg ${isToday ? 'bg-momflow-lavender/40' : 'bg-white/70'}`}>
                        <h3 className="font-bold text-momflow-text-dark mb-2">
                            {new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date)}{' '}
                            <span className="text-sm font-normal text-momflow-text-light">{day}</span>
                        </h3>
                        {dayEvents.length > 0 ? (
                            <div className="space-y-1.5">
                                {dayEvents.map(event => <EventPill key={event.id} event={event} onClick={() => setSelectedEvent(event)} color={categoryColorMap[event.category] || '#d1d5db'} />)}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Sin eventos.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
  };
  
  const renderDayView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = currentDate.toDateString() === today.toDateString();
    const dayEvents = filteredEvents.filter(e => e.date === dateString).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    return (
        <div className={`p-4 rounded-lg space-y-4 ${isToday ? 'bg-momflow-lavender/40' : 'bg-white/70'}`}>
             <h3 className="font-bold text-xl text-momflow-text-dark mb-2">
                Eventos del día
            </h3>
            {dayEvents.length > 0 ? (
                <div className="space-y-2">
                    {dayEvents.map(event => <EventPill key={event.id} event={event} onClick={() => setSelectedEvent(event)} color={categoryColorMap[event.category] || '#d1d5db'} />)}
                </div>
            ) : (
                <p className="text-center text-momflow-text-light py-8">No hay eventos para este día.</p>
            )}
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}
      {renderFilterBar()}
      <div className="flex-grow">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onSave={handleSaveEvent} categoryConfigs={categoryConfigs} />}
    </div>
  );
};

export default CalendarScreen;
