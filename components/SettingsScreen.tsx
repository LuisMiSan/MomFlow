
import React, { useState, useRef } from 'react';
import { WhatsAppIcon, GoogleIcon, CameraIcon, TrashIcon, PlusIcon } from './Icons';
import { CategoryConfig, Event, FamilyProfile, FamilyMember } from '../types';
import { useLanguage } from '../translations';

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
    const { t, language, toggleLanguage } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if(window.confirm(t.settings.deleteMemberConfirm)) {
            setFamilyProfile(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
        }
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert(t.settings.photoSizeError);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setFamilyProfile(prev => ({ ...prev, photoUrl: result }));
            };
            reader.readAsDataURL(file);
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
        
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
        />

        {/* Camera Icon Overlay */}
        <button 
            onClick={handlePhotoClick}
            className="absolute bottom-16 right-6 bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/40 transition-colors z-20"
            title="Cambiar foto de familia"
        >
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
                placeholder={t.settings.familyName}
                className="text-3xl font-bold text-[#2c3e50] text-center w-full focus:outline-none bg-transparent placeholder-gray-300 border-b border-transparent focus:border-gray-200 transition-colors"
              />
              <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-widest font-bold">{t.settings.familyName}</p>
          </div>

          {/* Member Settings Label */}
          <div className="w-full mb-4">
              <h3 className="text-gray-400 text-[10px] uppercase tracking-widest font-bold pl-2">{t.settings.members}</h3>
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
                                placeholder={t.contacts.name}
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
                <span>{t.settings.addMember}</span>
            </button>
          </div>

           {/* Integrations & Language */}
           <div className="w-full border-t border-gray-100 pt-6">
                <h3 className="text-gray-400 text-[10px] uppercase tracking-widest font-bold pl-2 mb-3">{t.settings.integrations}</h3>
                <div className="flex flex-wrap gap-3">
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

           {/* Language Switcher */}
           <div className="w-full border-t border-gray-100 pt-6 mt-2">
                <h3 className="text-gray-400 text-[10px] uppercase tracking-widest font-bold pl-2 mb-3">{t.settings.language}</h3>
                <div className="flex">
                    <button 
                        onClick={toggleLanguage}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                        <span className="text-xl">{language === 'es' ? '🇪🇸' : '🇺🇸'}</span>
                        <span className="text-sm font-semibold">{language === 'es' ? 'Español' : 'English'}</span>
                    </button>
                </div>
           </div>

      </div>
    </div>
  );
};

export default SettingsScreen;
