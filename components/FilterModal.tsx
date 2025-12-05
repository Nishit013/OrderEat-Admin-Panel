import React, { useState } from 'react';
import { X, Check, Search } from 'lucide-react';
import { FilterState } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
  availableCuisines: string[];
}

type FilterCategory = 'Sort' | 'Delivery Time' | 'Cuisines' | 'Rating' | 'Cost' | 'More';

export const FilterModal: React.FC<FilterModalProps> = ({ 
  isOpen, 
  onClose, 
  currentFilters, 
  onApply,
  availableCuisines 
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Sort');
  const [tempFilters, setTempFilters] = useState<FilterState>(currentFilters);
  const [cuisineSearch, setCuisineSearch] = useState('');

  if (!isOpen) return null;

  const handleClear = () => {
    setTempFilters({
      sortBy: 'Relevance',
      rating: null,
      isVeg: false,
      hasOffers: false,
      costRange: null,
      cuisines: [],
      deliveryTimeMax: undefined
    });
  };

  const categories: { id: FilterCategory; label: string }[] = [
    { id: 'Sort', label: 'Sort by' },
    { id: 'Delivery Time', label: 'Delivery Time' },
    { id: 'Cuisines', label: 'Cuisines' },
    { id: 'Rating', label: 'Rating' },
    { id: 'Cost', label: 'Cost per two' },
    { id: 'More', label: 'More filters' },
  ];

  const renderContent = () => {
    switch (activeCategory) {
      case 'Sort':
        return (
          <div className="space-y-2">
            {[
              { id: 'Relevance', label: 'Relevance' },
              { id: 'Rating', label: 'Rating: High to Low' },
              { id: 'DeliveryTime', label: 'Delivery Time' },
              { id: 'CostLow', label: 'Cost: Low to High' },
              { id: 'CostHigh', label: 'Cost: High to Low' },
            ].map((opt) => (
              <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input 
                  type="radio" 
                  name="sort" 
                  checked={tempFilters.sortBy === opt.id}
                  onChange={() => setTempFilters({ ...tempFilters, sortBy: opt.id as any })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <span className="text-gray-700 dark:text-gray-200 font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case 'Delivery Time':
         return (
            <div className="space-y-2">
                {[
                    { label: 'Any', value: undefined },
                    { label: 'Less than 30 mins', value: 30 },
                    { label: 'Less than 45 mins', value: 45 },
                    { label: 'Less than 60 mins', value: 60 },
                ].map((opt, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <input 
                            type="radio" 
                            name="deliveryTime"
                            checked={tempFilters.deliveryTimeMax === opt.value}
                            onChange={() => setTempFilters({ ...tempFilters, deliveryTimeMax: opt.value })}
                            className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                         <span className="text-gray-700 dark:text-gray-200 font-medium">{opt.label}</span>
                    </label>
                ))}
            </div>
         );
      case 'Cuisines':
        const filteredCuisines = availableCuisines.filter(c => c.toLowerCase().includes(cuisineSearch.toLowerCase()));
        return (
          <div className="flex flex-col h-full">
            <div className="relative mb-3 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search Cuisines" 
                    value={cuisineSearch}
                    onChange={(e) => setCuisineSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-gray-50 dark:bg-gray-800 dark:text-white"
                />
            </div>
            <div className="space-y-2 overflow-y-auto pr-2">
                {filteredCuisines.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No cuisines found</p>
                ) : (
                    filteredCuisines.map((cuisine) => (
                    <label key={cuisine} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${tempFilters.cuisines.includes(cuisine) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-400'}`}>
                        {tempFilters.cuisines.includes(cuisine) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input 
                        type="checkbox" 
                        className="hidden"
                        checked={tempFilters.cuisines.includes(cuisine)}
                        onChange={() => {
                            const newCuisines = tempFilters.cuisines.includes(cuisine)
                            ? tempFilters.cuisines.filter(c => c !== cuisine)
                            : [...tempFilters.cuisines, cuisine];
                            setTempFilters({ ...tempFilters, cuisines: newCuisines });
                        }}
                        />
                        <span className="text-gray-700 dark:text-gray-200 font-medium">{cuisine}</span>
                    </label>
                    ))
                )}
            </div>
          </div>
        );
      case 'Rating':
        return (
          <div className="space-y-2">
            {[null, 3.5, 4.0, 4.5].map((rating) => (
              <label key={String(rating)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                 <input 
                  type="radio" 
                  name="rating" 
                  checked={tempFilters.rating === rating}
                  onChange={() => setTempFilters({ ...tempFilters, rating: rating })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <span className="text-gray-700 dark:text-gray-200 font-medium">{rating ? `Rating ${rating}+` : 'Any Rating'}</span>
              </label>
            ))}
          </div>
        );
      case 'Cost':
        return (
          <div className="space-y-2">
            {[
              { id: 'any', label: 'Any', val: null },
              { id: 'low', label: 'Less than ₹300', val: [0, 300] },
              { id: 'mid', label: '₹300 - ₹600', val: [300, 600] },
              { id: 'high', label: 'More than ₹600', val: [600, 10000] },
            ].map((opt) => {
              const isSelected = JSON.stringify(tempFilters.costRange) === JSON.stringify(opt.val);
              return (
                <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input 
                    type="radio" 
                    name="cost"
                    checked={isSelected}
                    onChange={() => setTempFilters({ ...tempFilters, costRange: opt.val as [number, number] | null })}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{opt.label}</span>
                </label>
              );
            })}
          </div>
        );
      case 'More':
        return (
          <div className="space-y-4 p-2">
             <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <span className="text-gray-800 dark:text-gray-200 font-medium">Pure Veg</span>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${tempFilters.isVeg ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${tempFilters.isVeg ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input type="checkbox" className="hidden" checked={tempFilters.isVeg} onChange={() => setTempFilters({...tempFilters, isVeg: !tempFilters.isVeg})} />
             </label>

             <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <span className="text-gray-800 dark:text-gray-200 font-medium">Great Offers</span>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${tempFilters.hasOffers ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${tempFilters.hasOffers ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input type="checkbox" className="hidden" checked={tempFilters.hasOffers} onChange={() => setTempFilters({...tempFilters, hasOffers: !tempFilters.hasOffers})} />
             </label>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[75vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Filters</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 bg-gray-50/50 dark:bg-gray-950/50 border-r border-gray-100 dark:border-gray-800 py-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-4 py-4 font-bold text-sm sm:text-base border-l-4 transition-all relative ${
                  activeCategory === cat.id 
                  ? 'bg-white dark:bg-gray-900 border-purple-600 text-purple-700 dark:text-purple-400 shadow-sm' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900/50'
                }`}
              >
                {cat.label}
                {cat.id === 'Sort' && <div className="text-[10px] font-normal text-purple-600 mt-1 truncate max-w-[120px]">{tempFilters.sortBy.replace(/([A-Z])/g, ' $1').trim()}</div>}
                {cat.id === 'Cuisines' && tempFilters.cuisines.length > 0 && <div className="text-[10px] font-normal text-purple-600 mt-1">{tempFilters.cuisines.length} selected</div>}
                {cat.id === 'Delivery Time' && tempFilters.deliveryTimeMax && <div className="text-[10px] font-normal text-purple-600 mt-1">&lt; {tempFilters.deliveryTimeMax} mins</div>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-gray-900">
            {renderContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
          <button 
            onClick={handleClear}
            className="text-gray-500 dark:text-gray-400 font-bold text-sm px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            Clear all
          </button>
          <button 
            onClick={() => { onApply(tempFilters); onClose(); }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/50 transition transform active:scale-95"
          >
            Apply Filters
          </button>
        </div>

      </div>
    </div>
  );
};