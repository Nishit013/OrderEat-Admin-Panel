import React from 'react';
import { Star, Clock } from 'lucide-react';
import { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (restaurant: Restaurant) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick }) => {
  return (
    <div 
      onClick={() => onClick(restaurant)}
      className="bg-white dark:bg-gray-900 rounded-2xl hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
    >
      <div className="relative h-60 rounded-2xl overflow-hidden m-3 mb-0">
        <img 
          src={restaurant.imageUrl || 'https://picsum.photos/400/300'} 
          alt={restaurant.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Dark Gradient at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Promoted Tag */}
        {restaurant.promoted && (
            <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase">
            Promoted
            </div>
        )}

        {/* Time Pill */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-700" />
          {restaurant.deliveryTime}
        </div>
        
        {/* Discount Overlay - Zomato Style */}
        {restaurant.discount && (
             <div className="absolute bottom-3 left-0 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-r shadow-md uppercase">
                {restaurant.discount}
             </div>
        )}
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate max-w-[70%]">{restaurant.name}</h3>
          <div className="flex items-center bg-green-700 text-white px-1.5 py-0.5 rounded-md text-xs font-bold shadow-sm h-5">
            <span className="mr-0.5">{restaurant.rating.toFixed(1)}</span>
            <Star className="w-2.5 h-2.5 fill-current" />
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-3 font-normal">
          <p className="truncate w-2/3">{(restaurant.cuisine || []).join(', ')}</p>
          <p className="text-gray-700 dark:text-gray-300 font-medium">₹{restaurant.priceForTwo}</p>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center gap-3">
             <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <img src="https://b.zmtcdn.com/data/o2_assets/0b07ef18234c6fdf9365ad1c274ae0631612687510.png" alt="safe" className="w-3 h-3 opacity-60" />
             </div>
             <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-tight line-clamp-1">
                Follows all Max Safety measures to ensure your food is safe
             </p>
        </div>
      </div>
    </div>
  );
};