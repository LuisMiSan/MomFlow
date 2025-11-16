import React, { useState } from 'react';
import { WhatsAppIcon, GoogleIcon, XMarkIcon, PencilSquareIcon, TrashIcon, PlusIcon } from './Icons';
import { CategoryConfig, Event } from '../types';

const PRESET_COLORS = [
    '#82ca9d', '#8884d8', '#ffc658', '#ff8042', '#d1d5db',
    '#ff7373', '#a2d2ff', '#bdea8c', '#ffb5a7', '#fec89a'
];

interface CategoryModalProps {
    category: CategoryConfig | null;
    onClose: () => void;
    onSave: (category: CategoryConfig) => void;
    existingNames: string[];
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose, onSave, existingNames }) => {
    const [name, setName] = useState(category?.name || '');
    const [color, setColor] = useState(category?.color || PRESET_COLORS[0]);
    const [error, setError] = useState('');
    const isEditing = !!category;

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('El nombre no puede estar vacío.');
            return;
        }
        const isDuplicate = existingNames.some(
            existingName => existingName.toLowerCase() === trimmedName.toLowerCase() && (isEditing ? category.name.toLowerCase() !== trimmedName.toLowerCase() : true)
        );
        if (isDuplicate) {
            setError('Ya existe una categoría con este nombre.');
            return;
        }

        onSave({
            id: category?.id || `cat-${Date.now()}`,
            name: trimmedName,
            color,
            deletable: category?.deletable ?? true,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
                <header className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-momflow-text-dark">{isEditing ? 'Editar Categoría' : 'Añadir Categoría'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </header>
                <div className="p-4 space-y-4">
                    <div>
                        <label htmlFor="cat-name" className="block text-sm font-medium text-momflow-text-light mb-1">Nombre</label>
                        <input
                            id="cat-name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError('');
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-momflow-lavender-dark focus:border-momflow-lavender-dark"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-momflow-text-light mb-1">Color</label>
                        <div className="grid grid-cols-5 gap-2">
                            {PRESET_COLORS.map(c => (
                                <button key={c} onClick={() => setColor(c)} className={`w-10 h-10 rounded-full transition-transform transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-momflow-lavender-dark' : ''}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <footer className="p-4 bg-gray-50 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-momflow-text-dark font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-momflow-coral text-white font-semibold rounded-lg hover:bg-red-400">Guardar</button>
                </footer>
            </div>
        </div>
    );
};

interface SettingsScreenProps {
  isWhatsAppConnected: boolean;
  onToggleWhatsApp: () => void;
  isGoogleCalendarConnected: boolean;
  onToggleGoogleCalendar: () => void;
  categoryConfigs: CategoryConfig[];
  setCategoryConfigs: React.Dispatch<React.SetStateAction<CategoryConfig[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  isWhatsAppConnected, 
  onToggleWhatsApp, 
  isGoogleCalendarConnected, 
  onToggleGoogleCalendar,
  categoryConfigs,
  setCategoryConfigs,
  setEvents,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);

    const handleOpenModal = (category: CategoryConfig | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleSaveCategory = (newConfig: CategoryConfig) => {
        const oldName = editingCategory?.name;
        
        if (editingCategory) { // Editing existing
            setCategoryConfigs(prev => prev.map(c => c.id === newConfig.id ? newConfig : c));
             // Update events if name changed
            if (oldName && oldName !== newConfig.name) {
                setEvents(prevEvents => prevEvents.map(event => 
                event.category === oldName ? { ...event, category: newConfig.name } : event
                ));
            }
        } else { // Adding new
            setCategoryConfigs(prev => [...prev, newConfig]);
        }
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleDeleteCategory = (configToDelete: CategoryConfig) => {
        if (!configToDelete.deletable) return;
        if (window.confirm(`¿Estás segura de que quieres eliminar la categoría "${configToDelete.name}"? Los eventos existentes se moverán a "Otro".`)) {
            setCategoryConfigs(prev => prev.filter(c => c.id !== configToDelete.id));
            // Re-assign events to 'Otro'
            const otherCategory = categoryConfigs.find(c => c.name === 'Otro') || categoryConfigs[0];
            setEvents(prevEvents => prevEvents.map(event =>
                event.category === configToDelete.name ? { ...event, category: otherCategory.name } : event
            ));
        }
    };

  return (
    <>
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold text-momflow-text-dark">Ajustes</h1>
        <p className="text-momflow-text-light">Gestiona tus integraciones y preferencias.</p>
      </header>

      <section className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-momflow-text-dark">Integraciones</h2>
        
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
          <div className="flex items-center space-x-4">
            <WhatsAppIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-semibold text-momflow-text-dark">WhatsApp</p>
              <p className="text-sm text-momflow-text-light">Reenvía mensajes para crear eventos.</p>
            </div>
          </div>
          <button 
            onClick={onToggleWhatsApp}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              isWhatsAppConnected 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-momflow-lavender text-momflow-text-dark hover:bg-momflow-lavender-dark'
            }`}
          >
            {isWhatsAppConnected ? 'Desconectar' : 'Conectar'}
          </button>
        </div>

         <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 mt-2">
          <div className="flex items-center space-x-4">
            <GoogleIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-semibold text-momflow-text-dark">Google Calendar</p>
              <p className="text-sm text-momflow-text-light">Sincroniza eventos y recordatorios.</p>
            </div>
          </div>
          <button 
            onClick={onToggleGoogleCalendar}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              isGoogleCalendarConnected
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-momflow-lavender text-momflow-text-dark hover:bg-momflow-lavender-dark'
            }`}
            >
            {isGoogleCalendarConnected ? 'Desconectar' : 'Conectar'}
          </button>
        </div>
      </section>

      <section className="bg-white p-4 rounded-xl shadow-md">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-momflow-text-dark">Gestionar Categorías</h2>
            <button onClick={() => handleOpenModal()} className="flex items-center space-x-1 text-sm bg-momflow-lavender text-momflow-text-dark font-semibold px-3 py-1.5 rounded-full hover:bg-momflow-lavender-dark">
                <PlusIcon className="w-4 h-4" />
                <span>Añadir</span>
            </button>
         </div>
         <div className="space-y-2">
            {categoryConfigs.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-momflow-text-dark font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => handleOpenModal(cat)} className="text-momflow-text-light hover:text-momflow-lavender-dark">
                            <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        {cat.deletable && (
                             <button onClick={() => handleDeleteCategory(cat)} className="text-momflow-text-light hover:text-red-500">
                                <TrashIcon className="w-5 h-5" />
                             </button>
                        )}
                    </div>
                </div>
            ))}
         </div>
      </section>
    </div>
    {isModalOpen && (
        <CategoryModal
            category={editingCategory}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveCategory}
            existingNames={categoryConfigs.map(c => c.name)}
        />
    )}
    </>
  );
};

export default SettingsScreen;