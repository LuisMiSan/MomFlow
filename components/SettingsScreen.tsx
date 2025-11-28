
import React, { useState } from 'react';
import { WhatsAppIcon, GoogleIcon, XMarkIcon, PencilSquareIcon, TrashIcon, PlusIcon, CameraIcon } from './Icons';
import { CategoryConfig, Event, FamilyProfile, FamilyMember } from '../types';

const PRESET_COLORS = [
    '#ff8042', // Orange
    '#ffc658', // Yellow
    '#82ca9d', // Green
    '#8884d8', // Purple
    '#ff7373', // Red
    '#a2d2ff', // Light Blue
];

interface SettingsScreenProps {
  isWhatsAppConnected: boolean;
  onToggleWhatsApp: () => void;
  isGoogleCalendarConnected: boolean;
  onToggleGoogleCalendar: () => void;
  categoryConfigs: CategoryConfig[];
  setCategoryConfigs: React.Dispatch<React.SetStateAction<CategoryConfig[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  familyProfile: FamilyProfile;
  setFamilyProfile: React.Dispatch<React.SetStateAction<FamilyProfile>>;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  isWhatsAppConnected, 
  onToggleWhatsApp, 
  isGoogleCalendarConnected, 
  onToggleGoogleCalendar,
  categoryConfigs,
  setCategoryConfigs,
  setEvents,
  familyProfile,
  setFamilyProfile
}) => {
    
    const handleNameChange = (val: string) => {
        setFamilyProfile(prev => ({ ...prev, name: val }));
    };

    const handleMemberChange = (id: string, field: keyof FamilyMember, value: string) => {
        setFamilyProfile(prev => ({
            ...prev,
            members: prev.members.map(m => m.id === id ? { ...m, [field]: value } : m)
        }));
    };

    const handleTimezoneChange = (val: string) => {
        setFamilyProfile(prev => ({ ...prev, timezone: val }));
    };

    const addMember = () => {
        const newMember: FamilyMember = {
            id: `m-${Date.now()}`,
            name: '',
            color: PRESET_COLORS[familyProfile.members.length % PRESET_COLORS.length]
        };
        setFamilyProfile(prev => ({ ...prev, members: [...prev.members, newMember] }));
    };

    const removeMember = (id: string) => {
        if(window.confirm('¿Eliminar este miembro?')) {
            setFamilyProfile(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
        }
    };

  return (
    <div className="bg-white min-h-full pb-10">
      {/* Hero Image Section */}
      <div className="relative w-full h-64 bg-gray-300">
        <img 
            src={familyProfile.photoUrl} 
            alt="Family" 
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        {/* Placeholder for changing image functionality */}
        <button className="absolute bottom-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white/50 transition-colors">
            <CameraIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="px-6 -mt-8 relative z-10 space-y-8">
          
          {/* Family Name Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <input 
                type="text" 
                value={familyProfile.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="text-3xl font-bold text-momflow-text-dark text-center w-full focus:outline-none border-b-2 border-transparent focus:border-momflow-lavender-dark transition-colors bg-transparent placeholder-gray-300"
                placeholder="Nombre de la Familia"
              />
              <p className="text-gray-400 text-sm mt-1 uppercase tracking-wide font-medium">Family Name</p>
          </div>

          {/* Member Settings */}
          <div>
            <h3 className="text-lg font-semibold text-momflow-text-dark mb-3 px-1">Member Settings</h3>
            <div className="space-y-3">
                {familyProfile.members.map(member => (
                    <div key={member.id} className="flex items-center space-x-3 group">
                        <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-momflow-lavender">
                            {/* Color Dot Picker */}
                            <div className="dropdown relative group/color cursor-pointer mr-3">
                                <div className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: member.color }}></div>
                                {/* Simple hover color picker for demo */}
                                <div className="absolute top-6 left-0 bg-white shadow-xl rounded-lg p-2 flex gap-1 z-50 hidden group-hover/color:flex">
                                    {PRESET_COLORS.map(c => (
                                        <button 
                                            key={c} 
                                            onClick={() => handleMemberChange(member.id, 'color', c)}
                                            className="w-4 h-4 rounded-full hover:scale-110 transition-transform"
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <input 
                                type="text" 
                                value={member.name}
                                onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                                className="flex-1 bg-transparent focus:outline-none text-momflow-text-dark font-medium placeholder-gray-300"
                                placeholder="Nombre del miembro"
                            />
                        </div>
                        <button onClick={() => removeMember(member.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                ))}
                 <button 
                    onClick={addMember}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-momflow-lavender hover:text-momflow-lavender transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Añadir Miembro</span>
                </button>
            </div>
          </div>

          {/* Timezone Setting */}
           <div>
             <h3 className="text-lg font-semibold text-momflow-text-dark mb-3 px-1">Regional</h3>
             <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
                <select 
                    value={familyProfile.timezone}
                    onChange={(e) => handleTimezoneChange(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-momflow-text-dark font-medium appearance-none"
                >
                    <option value="GMT-7 America/Los_Angeles">GMT-7 America/Los_Angeles</option>
                    <option value="GMT-5 America/New_York">GMT-5 America/New_York</option>
                    <option value="GMT+1 Europe/Madrid">GMT+1 Europe/Madrid</option>
                    <option value="GMT+0 Europe/London">GMT+0 Europe/London</option>
                </select>
                <div className="w-3 h-3 rounded-full bg-blue-400 ml-2"></div>
             </div>
          </div>

           {/* System Integrations (Preserving old functionality in new style) */}
           <div className="pt-6 border-t border-gray-100">
             <h3 className="text-lg font-semibold text-momflow-text-dark mb-3 px-1">Integraciones</h3>
             <div className="space-y-3">
                 {/* WhatsApp */}
                 <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-3">
                         <WhatsAppIcon className="w-6 h-6 text-green-500" />
                         <span className="font-medium text-momflow-text-dark">WhatsApp</span>
                    </div>
                     <button 
                        onClick={onToggleWhatsApp}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${isWhatsAppConnected ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isWhatsAppConnected ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                 </div>
                 
                 {/* Google */}
                 <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-3">
                         <GoogleIcon className="w-6 h-6 text-blue-500" />
                         <span className="font-medium text-momflow-text-dark">Google Calendar</span>
                    </div>
                     <button 
                        onClick={onToggleGoogleCalendar}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${isGoogleCalendarConnected ? 'bg-blue-500' : 'bg-gray-200'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isGoogleCalendarConnected ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                 </div>
             </div>
           </div>

      </div>
    </div>
  );
};

export default SettingsScreen;
