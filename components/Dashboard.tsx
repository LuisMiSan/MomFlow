import React, { useState, useEffect, useMemo } from 'react';
import { Event, Category, CategoryConfig } from '../types';
import { getEmpatheticMessage } from '../services/geminiService';

const today = new Date();
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, '0');
const d = String(today.getDate()).padStart(2, '0');
const todayString = `${y}-${m}-${d}`;

interface CategoryPillProps {
  category: Category;
  color: string;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ category, color }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full`} style={{ backgroundColor: `${color}20`, color: color }}>
    {category}
  </span>
);

interface EventCardProps {
  event: Event;
  onClick: () => void;
  color: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick, color }) => (
  <button onClick={onClick} className="bg-white/80 p-3 rounded-lg flex items-center justify-between shadow-sm w-full text-left hover:bg-momflow-lavender/50 transition-colors">
    <div>
      <p className="font-semibold text-momflow-text-dark">{event.title}</p>
      <p className="text-sm text-momflow-text-light">{event.time}</p>
    </div>
    <CategoryPill category={event.category} color={color} />
  </button>
);

interface DashboardProps {
  events: Event[];
  categoryConfigs: CategoryConfig[];
  onNavigateToCalendar: (date: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ events, categoryConfigs, onNavigateToCalendar }) => {
  const [aiMessage, setAiMessage] = useState<string>('Cargando mensaje...');
  
  const categoryColorMap = useMemo(() => 
    Object.fromEntries(categoryConfigs.map(c => [c.name, c.color])),
    [categoryConfigs]
  );

  useEffect(() => {
    getEmpatheticMessage().then(setAiMessage);
  }, []);

  const todayEvents = events.filter(event => event.date === todayString);
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-momflow-text-dark">Hola, Mamá Moderna</h1>
        <p className="text-momflow-text-light">Aquí tienes un resumen de tu día.</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-3 text-momflow-text-dark">Próximos Eventos</h2>
        <div className="space-y-3">
          {todayEvents.length > 0 ? (
            todayEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={() => onNavigateToCalendar(event.date)} 
                color={categoryColorMap[event.category] || '#d1d5db'}
              />
            ))
          ) : (
            <div className="text-center py-4 bg-white/50 rounded-lg">
              <p className="text-momflow-text-light">No tienes eventos para hoy. ¡Disfruta!</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-momflow-lavender p-4 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-2 text-momflow-text-dark">Un Mensaje Para Ti</h2>
        <p className="text-momflow-text-dark italic">"{aiMessage}"</p>
      </section>
    </div>
  );
};

export default Dashboard;