import React, { useState } from 'react';
import { X, Star, Compass, ShoppingBag } from 'lucide-react';
import { MenuItem, Variant } from '../types';

interface DishDetailModalProps {
  item: MenuItem;
  restaurantId: string;
  onClose: () => void;
  onAddToCart: (item: MenuItem, restaurantId: string, variant?: Variant) => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ 
  item, 
  restaurantId, 
  onClose, 
  onAddToCart 
}) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
      item.variants && item.variants.length > 0 ? item.variants[0] : undefined
  );

  const currentPrice = selectedVariant ? selectedVariant.price : item.price;

  const handleAdd = () => {
      onAddToCart(item, restaurantId, selectedVariant);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 rounded-full shadow-md backdrop-blur-sm transition"
        >
            <X className="w-5 h-5 text-gray-800 dark:text-white" />
        </button>

        {/* Image Header */}
        <div className="h-60 w-full bg-gray-100 dark:bg-gray-800 relative shrink-0">
             {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                    <Compass className="w-12 h-12" />
                </div>
             )}
             <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent h-20 flex items-end p-4">
                 <div className={`w-4 h-4 border flex items-center justify-center rounded-sm shrink-0 bg-white ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                 </div>
             </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{item.name}</h2>
                {item.rating && (
                     <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg text-green-700 dark:text-green-400 text-xs font-bold border border-green-100 dark:border-green-900/30">
                        {item.rating} <Star className="w-3 h-3 fill-current" />
                     </div>
                )}
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">{item.description}</p>

            {item.variants && item.variants.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase mb-3">Choose Variant</h3>
                    <div className="space-y-3">
                        {item.variants.map((variant, idx) => (
                            <label 
                                key={idx} 
                                className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${selectedVariant?.name === variant.name ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedVariant?.name === variant.name ? 'border-purple-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {selectedVariant?.name === variant.name && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
                                    </div>
                                    <span className={`font-medium ${selectedVariant?.name === variant.name ? 'text-purple-900 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {variant.name}
                                    </span>
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200">₹{variant.price}</span>
                                <input 
                                    type="radio" 
                                    name="variant" 
                                    className="hidden" 
                                    checked={selectedVariant?.name === variant.name}
                                    onChange={() => setSelectedVariant(variant)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <button 
                onClick={handleAdd}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/50 transition-all active:scale-[0.98] flex justify-between px-6 items-center"
            >
                <div className="flex flex-col items-start leading-none">
                    <span className="text-xl">₹{currentPrice}</span>
                    <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Total</span>
                </div>
                <span className="flex items-center gap-2 text-lg">
                    Add to Cart <ShoppingBag className="w-5 h-5" />
                </span>
            </button>
        </div>

      </div>
    </div>
  );
};