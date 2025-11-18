

import React, { useState } from 'react';
import { Task, TaskList } from '../types';
import { PlusIcon } from './Icons';

interface TasksScreenProps {
    taskLists: TaskList[];
    setTaskLists: React.Dispatch<React.SetStateAction<TaskList[]>>;
    onVoiceAddTask: () => void;
}

const TasksScreen: React.FC<TasksScreenProps> = ({ taskLists, setTaskLists, onVoiceAddTask }) => {
    const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
    const [newSubtaskText, setNewSubtaskText] = useState('');

    const calculateCompletion = (tasks: Task[]): { completed: number; total: number } => {
        let completed = 0;
        let total = 0;
        tasks.forEach(task => {
            total++;
            if (task.completed) {
                completed++;
            }
            if (task.subtasks) {
                const subtaskCompletion = calculateCompletion(task.subtasks);
                completed += subtaskCompletion.completed;
                total += subtaskCompletion.total;
            }
        });
        return { completed, total };
    };

    const handleToggleTask = (listId: string, taskId: string) => {
        const toggleRecursively = (tasks: Task[]): Task[] => {
            return tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, completed: !task.completed };
                }
                if (task.subtasks) {
                    return { ...task, subtasks: toggleRecursively(task.subtasks) };
                }
                return task;
            });
        };

        setTaskLists(prevLists =>
            prevLists.map(list => {
                if (list.id === listId) {
                    return { ...list, tasks: toggleRecursively(list.tasks) };
                }
                return list;
            })
        );
    };

    const handleAddSubtask = (listId: string, parentTaskId: string) => {
        if (!newSubtaskText.trim()) {
            setAddingSubtaskTo(null);
            setNewSubtaskText('');
            return;
        }

        const newSubtask: Task = {
            id: `st-${Date.now()}`,
            text: newSubtaskText.trim(),
            completed: false,
        };

        const addRecursively = (tasks: Task[]): Task[] => {
            return tasks.map(task => {
                if (task.id === parentTaskId) {
                    const subtasks = task.subtasks ? [...task.subtasks, newSubtask] : [newSubtask];
                    return { ...task, subtasks };
                }
                if (task.subtasks) {
                    return { ...task, subtasks: addRecursively(task.subtasks) };
                }
                return task;
            });
        };

        setTaskLists(prevLists =>
            prevLists.map(list => {
                if (list.id === listId) {
                    return { ...list, tasks: addRecursively(list.tasks) };
                }
                return list;
            })
        );

        setNewSubtaskText('');
        setAddingSubtaskTo(null);
    };

    const handleInitiateAddSubtask = (taskId: string) => {
        setAddingSubtaskTo(taskId);
        setNewSubtaskText('');
    };
    
    // FIX: Replaced `JSX.Element` with `React.ReactElement` to resolve TypeScript error.
    const renderTasks = (tasks: Task[], listId: string): React.ReactElement => {
        return (
            <>
                {tasks.map(task => {
                    const isAddingSubtask = addingSubtaskTo === task.id;
                    return (
                        <div key={task.id}>
                            <div className="flex items-center space-x-3 py-1 group">
                                <input
                                    type="checkbox"
                                    id={`task-${task.id}`}
                                    checked={task.completed}
                                    onChange={() => handleToggleTask(listId, task.id)}
                                    className="h-5 w-5 rounded border-gray-300 text-momflow-lavender-dark focus:ring-momflow-lavender-dark flex-shrink-0"
                                />
                                <label htmlFor={`task-${task.id}`} className={`flex-1 text-momflow-text-dark ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                    {task.text}
                                </label>
                                <button
                                    onClick={() => handleInitiateAddSubtask(task.id)}
                                    className="opacity-0 group-hover:opacity-100 text-momflow-lavender-dark hover:text-momflow-lavender-dark focus:opacity-100 transition-opacity"
                                    aria-label="Añadir subtarea"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="pl-5 border-l-2 border-gray-200 ml-2.5">
                                {task.subtasks && renderTasks(task.subtasks, listId)}
                                {isAddingSubtask && (
                                    <div className="py-1">
                                        <input
                                            type="text"
                                            value={newSubtaskText}
                                            onChange={e => setNewSubtaskText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleAddSubtask(listId, task.id);
                                                if (e.key === 'Escape') setAddingSubtaskTo(null);
                                            }}
                                            onBlur={() => handleAddSubtask(listId, task.id)}
                                            placeholder="Añadir subtarea..."
                                            autoFocus
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-momflow-lavender-dark"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-momflow-text-dark">Mis Tareas</h1>
                <p className="text-momflow-text-light">Organiza tus pendientes y libera tu mente.</p>
            </header>

            <div className="space-y-4">
                {taskLists.map(list => {
                    const { completed: completedCount, total: totalCount } = calculateCompletion(list.tasks);
                    return (
                        <div key={list.id} className="bg-white p-4 rounded-xl shadow-md">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-bold text-momflow-text-dark">
                                    {list.icon} {list.name}
                                </h2>
                                <span className="text-sm font-medium text-momflow-text-light">
                                    {completedCount}/{totalCount}
                                </span>
                            </div>
                             <div className="space-y-1">
                                {list.tasks.length > 0 ? renderTasks(list.tasks, list.id) : (
                                    <p className="text-center text-gray-400 py-4">¡Todo listo en esta lista!</p>
                                )}
                            </div>
                        </div>
                    )
                })}
                 {taskLists.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-lg text-momflow-text-light">No tienes ninguna lista de tareas.</p>
                        <p className="text-sm text-gray-400 mt-2">Usa el asistente para crear tareas y listas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksScreen;
