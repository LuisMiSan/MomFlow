
import React, { useState } from 'react';
import { PlusIcon } from './Icons';
import { Recipe, MealPlan, MealType } from '../types';

// Mock data matching the screenshot
const mockRecipes: Recipe[] = [
    {
        id: 'r1',
        title: 'Arugula and Prosciutto Salad',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1740&auto=format&fit=crop',
        source: 'www.101cookbooks.com',
        url: '#',
        tags: ['Healthy', 'Quick']
    },
    {
        id: 'r2',
        title: 'Beef and Lamb Shawarma',
        image: 'https://images.unsplash.com/photo-1529006557810-274bc0b61f9b?q=80&w=1740&auto=format&fit=crop',
        source: 'www.101cookbooks.com',
        url: '#',
        tags: ['Meat', 'Dinner']
    },
    {
        id: 'r3',
        title: 'Berry Stuffed French Toast',
        image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1547&auto=format&fit=crop',
        source: 'www.101cookbooks.com',
        url: '#',
        tags: ['Breakfast', 'Sweet']
    },
    {
        id: 'r4',
        title: 'Carbonara',
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1742&auto=format&fit=crop',
        source: 'www.101cookbooks.com',
        url: '#',
        tags: ['Pasta', 'Italian']
    }
];

const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

const MealPlannerScreen: React.FC = () => {
    const [view, setView] = useState<'recipes' | 'planner'>('recipes');
    const [searchQuery, setSearchQuery] = useState('');
    const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Helper to get current week dates
    const getWeekDates = (baseDate: Date) => {
        const week = [];
        const current = new Date(baseDate);
        current.setDate(current.getDate() - current.getDay()); // Start on Sunday
        for (let i = 0; i < 7; i++) {
            week.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return week;
    };

    const weekDates = getWeekDates(selectedDate);

    const handleAddMeal = (recipeId: string, date: Date, type: MealType) => {
        const dateStr = date.toISOString().split('T')[0];
        const newMeal: MealPlan = {
            id: `m-${Date.now()}`,
            date: dateStr,
            type,
            recipeId
        };
        setMealPlan(prev => [...prev, newMeal]);
    };

    // Quick add to today for demo purposes when clicking "+" in recipe view
    const quickAddRecipe = (recipe: Recipe) => {
        const today = new Date().toISOString().split('T')[0];
        // Simple alert or modal would go here. For now, just add to today's dinner
        const newMeal: MealPlan = {
            id: `m-${Date.now()}`,
            date: today,
            type: 'dinner',
            recipeId: recipe.id
        };
        setMealPlan(prev => [...prev, newMeal]);
        alert(`"${recipe.title}" añadido a la cena de hoy.`);
    };

    const renderRecipeCard = (recipe: Recipe) => (
        <div key={recipe.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3 mb-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 text-sm truncate">{recipe.title}</h3>
                <p className="text-xs text-gray-500 truncate">For directions visit: {recipe.source}</p>
                <button className="text-xs text-[#FF8042] font-semibold mt-1">View</button>
            </div>
            <button 
                onClick={() => quickAddRecipe(recipe)}
                className="w-8 h-8 rounded-full border border-[#FF8042] flex items-center justify-center text-[#FF8042] hover:bg-[#FF8042] hover:text-white transition-colors"
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
    );

    const renderPlanner = () => {
        return (
            <div className="space-y-4 pb-20">
                {/* Week Header */}
                <div className="grid grid-cols-7 text-center mb-2">
                    {weekDates.map((date, i) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                            <div key={i} className="flex flex-col items-center">
                                <span className="text-xs text-gray-400 font-medium">{days[i]}</span>
                                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mt-1 ${isToday ? 'bg-[#38a6e9] text-white' : 'text-gray-700'}`}>
                                    {date.getDate()}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="space-y-6">
                    {mealTypes.map(type => (
                        <div key={type}>
                            <h3 className="uppercase text-xs font-bold text-gray-400 tracking-wider mb-2 px-2">
                                {type === 'breakfast' ? 'Desayuno' : type === 'lunch' ? 'Comida' : 'Cena'}
                            </h3>
                            <div className="grid grid-cols-7 gap-1">
                                {weekDates.map((date, i) => {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const meal = mealPlan.find(m => m.date === dateStr && m.type === type);
                                    const recipe = meal ? mockRecipes.find(r => r.id === meal.recipeId) : null;
                                    
                                    return (
                                        <div key={i} className="aspect-square bg-white rounded-lg border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                                            {recipe ? (
                                                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <button className="text-gray-200 hover:text-gray-400">
                                                    <PlusIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#f8f9fa] min-h-full">
            {/* Header / Tabs */}
            <div className="bg-[#38a6e9] p-4 pb-8 rounded-b-[30px] shadow-lg mb-4">
                <div className="flex justify-center mb-4">
                    <h1 className="text-white font-bold text-lg">Set the week's menu</h1>
                </div>
                <div className="flex bg-white/20 p-1 rounded-full backdrop-blur-sm">
                    <button 
                        onClick={() => setView('recipes')}
                        className={`flex-1 py-1.5 text-sm font-semibold rounded-full transition-all ${view === 'recipes' ? 'bg-white text-[#38a6e9] shadow-sm' : 'text-white'}`}
                    >
                        Recetas
                    </button>
                    <button 
                        onClick={() => setView('planner')}
                        className={`flex-1 py-1.5 text-sm font-semibold rounded-full transition-all ${view === 'planner' ? 'bg-white text-[#38a6e9] shadow-sm' : 'text-white'}`}
                    >
                        Planificador
                    </button>
                </div>
                {view === 'recipes' && (
                     <p className="text-center text-white/90 text-sm mt-3 font-medium">with just a few taps</p>
                )}
            </div>

            <div className="px-4">
                {view === 'recipes' ? (
                    <>
                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <input 
                                type="text" 
                                placeholder="Search recipes" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-200 text-gray-700 px-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38a6e9]"
                            />
                            <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        {/* Filters */}
                        <div className="flex space-x-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                            <button className="px-4 py-1.5 bg-[#FF8042] text-white text-xs font-bold rounded-full whitespace-nowrap shadow-sm">
                                Family Recipe Box
                            </button>
                            <button className="px-4 py-1.5 bg-white text-gray-600 text-xs font-bold rounded-full whitespace-nowrap border border-gray-200">
                                Cozi Top 20
                            </button>
                            <button className="px-4 py-1.5 bg-white text-gray-600 text-xs font-bold rounded-full whitespace-nowrap border border-gray-200">
                                Under 45-Min
                            </button>
                        </div>

                        {/* Section Title */}
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-gray-700 text-center">Select Recipes</h2>
                        </div>

                        {/* Add New Recipe Button */}
                        <button className="flex items-center space-x-2 text-[#FF8042] font-bold mb-4 hover:opacity-80 transition-opacity">
                            <PlusIcon className="w-5 h-5" />
                            <span>Add new recipe</span>
                        </button>

                        {/* Recipe List */}
                        <div className="pb-20">
                            {mockRecipes.map(renderRecipeCard)}
                        </div>
                    </>
                ) : (
                    renderPlanner()
                )}
            </div>
        </div>
    );
};

export default MealPlannerScreen;
