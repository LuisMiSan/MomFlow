
import React, { useState } from 'react';
import { Contact } from '../types';
import { PlusIcon, XMarkIcon, PencilSquareIcon, TrashIcon, PhoneIcon } from './Icons';
import { useLanguage } from '../translations';

interface ContactModalProps {
    contact: Omit<Contact, 'id'> | Contact | null;
    onClose: () => void;
    onSave: (contact: Omit<Contact, 'id'> | Contact) => void;
    existingNames: string[];
}

const ContactModal: React.FC<ContactModalProps> = ({ contact, onClose, onSave, existingNames }) => {
    const { t } = useLanguage();
    const [name, setName] = useState(contact?.name || '');
    const [relation, setRelation] = useState(contact?.relation || '');
    const [phone, setPhone] = useState(contact?.phone || '');
    const [notes, setNotes] = useState(contact?.notes || '');
    const [error, setError] = useState('');
    const isEditing = !!(contact && 'id' in contact);

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName || !relation.trim() || !phone.trim()) {
            setError(t.common.error);
            return;
        }
        
        onSave({
            ...contact,
            name: trimmedName,
            relation: relation.trim(),
            phone: phone.trim(),
            notes: notes.trim(),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
                <header className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-momflow-text-dark">{isEditing ? t.contacts.editTitle : t.contacts.addTitle}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </header>
                <div className="p-4 space-y-4">
                    <div>
                        <label htmlFor="contact-name" className="block text-sm font-medium text-momflow-text-light mb-1">{t.contacts.name}</label>
                        <input id="contact-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-momflow-lavender-dark focus:border-momflow-lavender-dark" />
                    </div>
                    <div>
                        <label htmlFor="contact-relation" className="block text-sm font-medium text-momflow-text-light mb-1">{t.contacts.relation}</label>
                        <input id="contact-relation" type="text" value={relation} onChange={(e) => setRelation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-momflow-lavender-dark focus:border-momflow-lavender-dark" />
                    </div>
                     <div>
                        <label htmlFor="contact-phone" className="block text-sm font-medium text-momflow-text-light mb-1">{t.contacts.phone}</label>
                        <input id="contact-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-momflow-lavender-dark focus:border-momflow-lavender-dark" />
                    </div>
                    <div>
                        <label htmlFor="contact-notes" className="block text-sm font-medium text-momflow-text-light mb-1">{t.contacts.notes}</label>
                        <textarea id="contact-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-momflow-lavender-dark focus:border-momflow-lavender-dark" />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <footer className="p-4 bg-gray-50 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-momflow-text-dark font-semibold rounded-lg hover:bg-gray-300">{t.common.cancel}</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-momflow-coral text-white font-semibold rounded-lg hover:bg-red-400">{t.common.save}</button>
                </footer>
            </div>
        </div>
    );
};


interface ContactCardProps {
    contact: Contact;
    onEdit: () => void;
    onDelete: () => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onEdit, onDelete }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-momflow-text-dark">{contact.name}</h3>
                    <p className="text-sm font-semibold text-momflow-lavender-dark">{contact.relation}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={onEdit} className="text-momflow-text-light hover:text-momflow-lavender-dark">
                        <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button onClick={onDelete} className="text-momflow-text-light hover:text-red-500">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="mt-3 border-t pt-3 space-y-2">
                 <div className="flex items-center space-x-3 text-momflow-text-dark">
                    <PhoneIcon className="w-5 h-5 text-momflow-text-light"/>
                    <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                </div>
                {contact.notes && (
                     <p className="text-sm text-momflow-text-light bg-gray-50 p-2 rounded-md">{contact.notes}</p>
                )}
            </div>
        </div>
    );
};


interface ContactsScreenProps {
    contacts: Contact[];
    setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

const ContactsScreen: React.FC<ContactsScreenProps> = ({ contacts, setContacts }) => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    const handleOpenModal = (contact: Contact | null = null) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContact(null);
    };

    const handleSaveContact = (contactData: Omit<Contact, 'id'> | Contact) => {
        if ('id' in contactData) {
            // Editing
            setContacts(prev => prev.map(c => c.id === contactData.id ? contactData : c));
        } else {
            // Adding
            const newContact: Contact = {
                ...contactData,
                id: `c-${Date.now()}`,
            };
            setContacts(prev => [...prev, newContact]);
        }
        handleCloseModal();
    };
    
    const handleDeleteContact = (contactId: string) => {
        if (window.confirm(t.contacts.confirmDelete)) {
            setContacts(prev => prev.filter(c => c.id !== contactId));
        }
    };

    return (
        <>
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-momflow-text-dark">{t.contacts.title}</h1>
                    <p className="text-momflow-text-light">{t.contacts.subtitle}</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center space-x-2 bg-momflow-lavender text-momflow-text-dark font-semibold px-4 py-2 rounded-full hover:bg-momflow-lavender-dark shadow-md"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>{t.common.add}</span>
                </button>
            </header>
            
            <div className="space-y-4">
                {contacts.length > 0 ? (
                    contacts
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .map(contact => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                onEdit={() => handleOpenModal(contact)}
                                onDelete={() => handleDeleteContact(contact.id)}
                            />
                        ))
                ) : (
                    <div className="text-center py-16 bg-white/50 rounded-lg">
                        <p className="text-lg text-momflow-text-light">{t.contacts.empty}</p>
                    </div>
                )}
            </div>
        </div>
        {isModalOpen && (
            <ContactModal
                contact={editingContact}
                onClose={handleCloseModal}
                onSave={handleSaveContact}
                existingNames={contacts.map(c => c.name)}
            />
        )}
        </>
    );
};

export default ContactsScreen;
