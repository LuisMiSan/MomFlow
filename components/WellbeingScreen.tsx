
import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Category, WellbeingData, CategoryConfig, Event } from '../types';
import { getWellbeingTip } from '../services/geminiService';
import { LoadingIcon, SparklesIcon, CalendarDaysIcon } from './Icons';
import { useLanguage } from '../translations';

// Data can be shared from a central place later
const wellbeingData: WellbeingData[] = [
  { name: 'Trabajo', value: 40 },
  { name: 'Hijos', value: 30 },
  { name: 'Hogar', value: 15 },
  { name: 'Personal', value: 15 },
];

const moods = [
  { emoji: '😊', label: 'Feliz' },
  { emoji: '🙂', label: 'Bien' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Triste' },
  { emoji: '😫', label: 'Agotada' },
];

interface WellbeingScreenProps {
  categoryConfigs: CategoryConfig[];
  events: Event[];
}

const WellbeingScreen: React.FC<WellbeingScreenProps> = ({ categoryConfigs, events }) => {
  const { t, language } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string>('');

  const categoryColorMap = useMemo(() => 
    Object.fromEntries(categoryConfigs.map(c => [c.name, c.color])),
    [categoryConfigs]
  );

  useEffect(() => {
    getWellbeingTip().then(setAiTip);
  }, []);

  // Filter for self-care and health related events
  const selfCareEvents = useMemo(() => {
    const keywords = [
        'yoga', 'pilates', 'spa', 'uñas', 'nails', 'manicura', 'pedicura',
        'pelo', 'peluquería', 'cabello', 'corte', 'tinte',
        'masaje', 'fisio', 'entreno', 'gym', 'gimnasio', 'meditación',
        'médico', 'doctor', 'ginecólogo', 'cita', 'salud', 'revisión',
        'dermatólogo', 'facial', 'skin', 'regla', 'menstruación'
    ];
    
    const today = new Date();
    today.setHours(0,0,0,0);

    return events.filter(event => {
        // Only future or today's events
        const eventDate = new Date(event.date);
        if (eventDate < today) return false;

        const text = (event.title + ' ' + event.category).toLowerCase();
        // Check if it's explicitly "Personal" category OR contains a keyword
        const isKeywordMatch = keywords.some(k => text.includes(k));
        const isCategoryMatch = event.category === 'Personal';

        return isKeywordMatch || isCategoryMatch;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-momflow-text-dark">{t.wellbeing.title}</h1>
        <p className="text-momflow-text-light">{t.wellbeing.subtitle}</p>
      </header>

      {/* Mood Tracker */}
      <section className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-momflow-text-dark text-center">{t.wellbeing.moodTitle}</h2>
        <div className="flex justify-around items-center">
          {moods.map(({ emoji, label }) => (
            <button
              key={label}
              onClick={() => setSelectedMood(emoji)}
              className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-all transform hover:scale-110 ${selectedMood === emoji ? 'bg-momflow-lavender' : 'bg-transparent'}`}
              aria-label={`Registrar estado de ánimo: ${label}`}
            >
              <span className="text-4xl">{emoji}</span>
              <span className="text-xs text-momflow-text-light">{label}</span>
            </button>
          ))}
        </div>
        {selectedMood && (
          <p className="text-center mt-4 text-momflow-sage font-semibold">{t.wellbeing.moodThanks}</p>
        )}
      </section>

      {/* NEW SECTION: Self-Care & Health Events */}
      <section className="bg-white p-4 rounded-xl shadow-md border-l-4 border-momflow-coral">
          <div className="flex items-center space-x-2 mb-4">
              <SparklesIcon className="w-6 h-6 text-momflow-coral" />
              <h2 className="text-xl font-semibold text-momflow-text-dark">{t.wellbeing.selfCareTitle}</h2>
          </div>
          
          {selfCareEvents.length > 0 ? (
              <div className="space-y-3">
                  {selfCareEvents.slice(0, 3).map(event => (
                      <div key={event.id} className="flex items-center bg-gray-50 p-3 rounded-lg hover:bg-momflow-lavender/20 transition-colors">
                           <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center border border-gray-100 shadow-sm mr-3">
                                <span className="text-xs font-bold text-gray-500 uppercase">{new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', { month: 'short' }).format(new Date(event.date))}</span>
                                <span className="text-lg font-bold text-momflow-text-dark">{new Date(event.date).getDate()}</span>
                           </div>
                           <div className="flex-1 min-w-0">
                               <h3 className="font-semibold text-momflow-text-dark truncate">{event.title}</h3>
                               <p className="text-xs text-gray-500 flex items-center">
                                   {event.time && <span className="mr-2">{event.time}</span>}
                                   <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-momflow-coral/20 text-momflow-coral font-medium uppercase tracking-wide">
                                       {event.category}
                                   </span>
                               </p>
                           </div>
                      </div>
                  ))}
                  {selfCareEvents.length > 3 && (
                      <p className="text-center text-xs text-gray-400 mt-2">+{selfCareEvents.length - 3}...</p>
                  )}
              </div>
          ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-momflow-text-light font-medium">{t.wellbeing.noSelfCare}</p>
              </div>
          )}
      </section>
      
      {/* Weekly Balance Chart */}
      <section className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-3 text-momflow-text-dark text-center">{t.wellbeing.balanceTitle}</h2>
        <div className="w-full h-64 relative min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie data={wellbeingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                {wellbeingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColorMap[entry.name] || '#d1d5db'} />
                ))}
              </Pie>
              <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" 
                formatter={(value) => <span className="text-momflow-text-light">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* AI Self-care Tip */}
      <section className="bg-momflow-sage/30 p-4 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-2 text-momflow-text-dark">{t.wellbeing.tipTitle}</h2>
        {aiTip ? (
          <p className="text-momflow-text-dark italic">"{aiTip}"</p>
        ) : (
          <div className="flex items-center space-x-2 text-momflow-text-light">
             <LoadingIcon className="w-5 h-5 animate-spin" /> 
             <span>{t.wellbeing.generating}</span>
          </div>
        )}
      </section>
    </div>
  );
};

export default WellbeingScreen;
