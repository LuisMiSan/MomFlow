import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Category, WellbeingData, CategoryConfig } from '../types';
import { getWellbeingTip } from '../services/geminiService';
import { LoadingIcon } from './Icons';

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
}

const WellbeingScreen: React.FC<WellbeingScreenProps> = ({ categoryConfigs }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string>('');

  const categoryColorMap = useMemo(() => 
    Object.fromEntries(categoryConfigs.map(c => [c.name, c.color])),
    [categoryConfigs]
  );

  useEffect(() => {
    getWellbeingTip().then(setAiTip);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-momflow-text-dark">Panel de Bienestar</h1>
        <p className="text-momflow-text-light">Tu espacio para conectar contigo misma.</p>
      </header>

      {/* Mood Tracker */}
      <section className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-momflow-text-dark text-center">¿Cómo te sientes hoy?</h2>
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
          <p className="text-center mt-4 text-momflow-sage font-semibold">¡Gracias por compartir cómo te sientes!</p>
        )}
      </section>
      
      {/* Weekly Balance Chart */}
      <section className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-3 text-momflow-text-dark text-center">Balance Semanal</h2>
        <div className="w-full h-64">
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
        <h2 className="text-lg font-semibold mb-2 text-momflow-text-dark">Tu Momento de Autocuidado</h2>
        {aiTip ? (
          <p className="text-momflow-text-dark italic">"{aiTip}"</p>
        ) : (
          <div className="flex items-center space-x-2 text-momflow-text-light">
             <LoadingIcon className="w-5 h-5 animate-spin" /> 
             <span>Generando un consejo para ti...</span>
          </div>
        )}
      </section>
    </div>
  );
};

export default WellbeingScreen;