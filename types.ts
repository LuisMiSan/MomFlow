
export type Category = string;

export interface CategoryConfig {
  id: string;
  name: Category;
  color: string;
  deletable: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

export interface FamilyProfile {
  name: string;
  photoUrl: string;
  timezone: string;
  members: FamilyMember[];
}

export interface Event {
  id: string;
  title: string;
  category: Category;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM AM/PM
  reminder?: string; // e.g., 'none', '5m', '15m', '1h', '1d'
  recurring?: string; // e.g., 'none', 'daily', 'weekly', 'monthly'
  source?: 'momflow' | 'google';
  subtasks?: Task[];
  audio?: string; // base64 encoded audio data URL
}

export interface WellbeingData {
  name: Category;
  value: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  subtasks?: Task[];
}

export interface TaskList {
  id: string;
  name: string;
  icon: string; // emoji character
  tasks: Task[];
}

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  notes?: string;
}
