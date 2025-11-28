
import React, { useState } from 'react';
import { WhatsAppIcon, GoogleIcon, CameraIcon, TrashIcon, PlusIcon } from './Icons';
import { CategoryConfig, Event, FamilyProfile, FamilyMember } from '../types';

const PRESET_COLORS = [
    '#ff8042', // Orange (Kevin)
    '#ffc658', // Yellow (Jason)
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
    <div className="min-h-full bg-[#38a6e9] relative overflow-hidden">
      
      {/* 1. Hero Image Background */}
      <div className="absolute top-0 w-full h-[50vh] z-0">
        <img 
            src={familyProfile.photoUrl} 
            alt="Family" 
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Camera Icon Overlay */}
        <button className="absolute bottom-16 right-6 bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/40 transition-colors">
            <CameraIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* 2. Overlapping White Card */}
      <div className="relative z-10 mt-[40vh] bg-white rounded-t-[40px] min-h-[60vh] pb-20 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] flex flex-col items-center pt-8 px-6">
          
          {/* Family Title */}
          <div className="w-full text-center mb-8">
              <input 
                type="text" 
                value={familyProfile.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="text-3xl font-bold text-[#2c3e50] text-center w-full focus:outline-none bg-transparent"
              />
              <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-widest font-bold">Family Name</p>
          </div>

          {/* Member Settings Label */}
          <div className="w-full mb-4">
              <h3 className="text-gray-400 text-[10px] uppercase tracking-widest font-bold pl-2">Member Settings</h3>
          </div>

          {/* Members List */}
          <div className="w-full space-y-3 mb-8">
              {familyProfile.members.map(member => (
                  <div key={member.id} className="flex items-center space-x-2 group">
                       <div className="flex-1 h-14 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center px-4 transition-all focus-within:ring-2 focus-within:ring-[#38a6e9] focus-within:border-transparent">
                            {/* Color Dot inside input area */}
                            <div className="relative group/color mr-3 cursor-pointer">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }}></div>
                                <div className="absolute top-5 left-0 bg-white shadow-xl rounded-lg p-2 flex gap-1 z-50 hidden group-hover/color:flex border border-gray-100">
                                    {PRESET_COLORS.map(c => (
                                        <button 
                                            key={c} 
                                            onClick={() => handleMemberChange(member.id, 'color', c)}
                                            className="w-4 h-4 rounded-full hover:scale-125 transition-transform"
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <input 
                                type="text" 
                                value={member.name}
                                onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                                className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 font-medium placeholder-gray-300 h-full"
                                placeholder="Name"
                            />
                       </div>
                       
                       <button onClick={() => removeMember(member.id)} className="p-3 text-gray-300 hover:text-red-400 transition-colors">
                           <TrashIcon className="w-5 h-5" />
                       </button>
                  </div>
              ))}

              <button 
                onClick={addMember}
                className="w-full h-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-[#38a6e9] hover:text-[#38a6e9] transition-colors flex items-center justify-center space-x-2 text-sm font-semibold"
            >
                <PlusIcon className="w-4 h-4" />
                <span>Add Member</span>
            </button>
          </div>

          {/* Theme Selector (Fixed 'Blue' style from image) */}
           <div className="w-full flex items-center justify-center space-x-2 mb-8">
               <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full cursor-pointer border border-blue-100">
                   <div className="w-3 h-3 rounded-full bg-[#38a6e9]"></div>
                   <span className="text-[#38a6e9] font-bold text-sm">Blue</span>
               </div>
           </div>

           {/* Integrations (Kept discreet at bottom) */}
           <div className="w-full border-t border-gray-100 pt-6">
                <h3 className="text-gray-400 text-[10px] uppercase tracking-widest font-bold pl-2 mb-3">Integrations</h3>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                    <button 
                        onClick={onToggleWhatsApp}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${isWhatsAppConnected ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500'}`}
                    >
                        <WhatsAppIcon className="w-4 h-4" />
                        <span className="text-xs font-semibold">WhatsApp</span>
                    </button>
                    <button 
                        onClick={onToggleGoogleCalendar}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${isGoogleCalendarConnected ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500'}`}
                    >
                        <GoogleIcon className="w-4 h-4" />
                        <span className="text-xs font-semibold">Calendar</span>
                    </button>
                </div>
           </div>

      </div>
    </div>
  );
};

export default SettingsScreen;
