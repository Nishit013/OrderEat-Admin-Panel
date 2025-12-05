import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus, Search, Star, Share2, Info, Heart, Compass, ShoppingBag } from 'lucide-react';
import { Restaurant, MenuItem, CartItem, Variant } from '../types';
import { DishDetailModal } from './DishDetailModal';

interface MenuModalProps {
  restaurant: Restaurant;
  onClose: () => void;
  cart: CartItem[];
  onAddToCart: (item: MenuItem, restaurantId: string, variant?: Variant) => void;
  onRemoveFromCart: (itemId: string, restaurantId: string) => void;
  onOpenCart: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({ 
  restaurant, 
  onClose, 
  cart, 
  onAddToCart, 
  onRemoveFromCart,
  onOpenCart
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [filterVeg, setFilterVeg] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Recommended');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const isCartVisible = cartItemCount > 0;

  const menuItems = Object.values(restaurant.menu || {}) as MenuItem[];
  
  // Group items by category
  const categories = Array.from(new Set(menuItems.map(item => item.category)));
  categories.sort();

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = menuItems.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const getQuantity = (itemId: string) => {
    return cart.filter(i => i.id === itemId && i.restaurantId === restaurant.id)
               .reduce((acc, i) => acc + i.quantity, 0);
  };

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-${category}`);
    if (element) {
      const offset = 180; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      
      if(scrollContainerRef.current) {
          const currentScroll = scrollContainerRef.current.scrollTop;
          const elementTop = element.getBoundingClientRect().top;
          const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
          scrollContainerRef.current.scrollTo({
              top: currentScroll + (elementTop - containerTop) - 20,
              behavior: 'smooth'
          });
      }
    }
  };

  useEffect(() => {
    if (showMobileSearch && mobileInputRef.current) {
        mobileInputRef.current.focus();
    }
  }, [showMobileSearch]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950 overflow-hidden animate-in fade-in duration-200">
      
      {/* 1. Header Navigation */}
      <div className="h-14 sm:h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-8 bg-white dark:bg-gray-950 shrink-0 sticky top-0 z-50 shadow-sm">
         <div className="flex items-center gap-4 flex-1">
             {/* Mobile: Show restaurant name in header, or Search Input */}
            <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              OrderEat
            </h1>
            
            {showMobileSearch ? (
                 <div className="flex-1 sm:hidden animate-in slide-in-from-right duration-200">
                     <input
                        ref={mobileInputRef}
                        type="text"
                        placeholder="Search items..."
                        className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 dark:text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => { if(!searchQuery) setShowMobileSearch(false); }}
                     />
                 </div>
            ) : (
                <div className="sm:hidden font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px]">
                    {restaurant.name}
                </div>
            )}
         </div>

         <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Desktop Search */}
            <div className="hidden sm:flex items-center border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-900 w-64">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input 
                    type="text" 
                    placeholder="Search within menu..." 
                    className="bg-transparent text-sm w-full focus:outline-none dark:text-white dark:placeholder-gray-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Mobile Search Toggle */}
            {!showMobileSearch && (
                <button 
                    onClick={() => setShowMobileSearch(true)}
                    className="sm:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                    <Search className="w-5 h-5" />
                </button>
            )}

            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition bg-gray-50 dark:bg-gray-800 sm:bg-transparent">
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
            </button>
         </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col sm:flex-row max-w-7xl mx-auto w-full">
         
         {/* Left Sidebar - Categories (Desktop) */}
         <div className="hidden sm:block w-64 border-r border-gray-100 dark:border-gray-800 h-full overflow-y-auto pb-24 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Categories</p>
                <div className="space-y-1">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => scrollToCategory(cat)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex justify-between items-center ${activeCategory === cat ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            {cat}
                            <span className="text-xs opacity-60">({groupedItems[cat].length})</span>
                        </button>
                    ))}
                </div>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="flex-1 overflow-y-auto h-full relative scroll-smooth bg-gray-50/30 dark:bg-gray-900/20" ref={scrollContainerRef}>
            
            {/* Restaurant Info Header */}
            <div className="bg-white dark:bg-gray-950 p-4 sm:p-8 pb-4">
                <div className="hidden sm:block text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <span>Home</span> / <span>New Delhi</span> / <span className="text-gray-600 dark:text-gray-300">{restaurant.name}</span>
                </div>
                
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">{restaurant.name}</h1>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>{(restaurant.cuisine || []).join(', ')}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{restaurant.address}</span>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 mb-6">
                    <div className="flex flex-col items-center bg-green-700 text-white px-2 py-1 rounded-lg shadow-sm">
                         <div className="flex items-center gap-1 text-sm sm:text-lg font-bold">
                             {restaurant.rating.toFixed(1)} <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                         </div>
                         <span className="text-[8px] sm:text-[10px] font-medium opacity-90 border-t border-green-600 w-full text-center mt-0.5 pt-0.5">1K+ ratings</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex flex-col items-center px-2 py-1">
                         <span className="text-sm sm:text-lg font-bold text-gray-800 dark:text-gray-200">{restaurant.deliveryTime}</span>
                         <span className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Delivery Time</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                     <div className="flex flex-col items-center px-2 py-1">
                         <span className="text-sm sm:text-lg font-bold text-gray-800 dark:text-gray-200">₹{restaurant.priceForTwo}</span>
                         <span className="text-[8px] sm:text-[10px] text-gray-400 uppercase">Cost for two</span>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-3 pb-0 border-b-0 sm:border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide">
                    <label className="flex items-center gap-2 cursor-pointer select-none border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition bg-white dark:bg-gray-900 shadow-sm shrink-0">
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${filterVeg ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} onClick={() => setFilterVeg(!filterVeg)}>
                            <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-300 ${filterVeg ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className={`text-xs font-bold ${filterVeg ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>Veg Only</span>
                    </label>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                     <button className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0">
                        <Heart className="w-3.5 h-3.5" /> Favourite
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0">
                        <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                </div>
            </div>

            {/* Mobile Category Nav (Sticky) */}
            <div className="sm:hidden sticky top-0 bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800 z-40 shadow-sm">
                <div className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-3">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => scrollToCategory(cat)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition ${activeCategory === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items */}
            <div className="bg-gray-100/50 dark:bg-black/20 min-h-screen pb-32 sm:pb-24">
                {categories.map((category) => {
                     const items = groupedItems[category].filter(item => {
                        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesVeg = filterVeg ? item.isVeg : true;
                        return matchesSearch && matchesVeg;
                     });

                     if (items.length === 0) return null;

                     return (
                        <div key={category} id={`category-${category}`} className="p-4 sm:p-8 pt-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 sm:mb-6 flex items-center gap-2">
                                {category}
                                <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800 ml-4"></span>
                            </h3>

                            <div className="space-y-4 sm:space-y-6">
                                {items.map(item => {
                                    const qty = getQuantity(item.id);
                                    return (
                                        <div 
                                            key={item.id} 
                                            onClick={() => setSelectedDish(item)}
                                            className="bg-white dark:bg-gray-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between gap-3 sm:gap-8 relative overflow-hidden cursor-pointer hover:shadow-md transition"
                                        >
                                            <div className="flex-1 py-1">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`w-3 h-3 sm:w-4 sm:h-4 border flex items-center justify-center rounded-sm shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                                    </span>
                                                    {item.votes && item.votes > 10 && (
                                                        <div className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-1 rounded border border-yellow-100 dark:border-yellow-900/30">
                                                            <Star className="w-2.5 h-2.5 fill-current" />
                                                            <span>Bestseller</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg leading-tight">{item.name}</h4>
                                                <div className="flex items-center gap-2 mt-1 mb-2">
                                                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                                        ₹{item.price}
                                                        {item.variants && <span className="text-xs text-gray-400 ml-1 font-normal">onwards</span>}
                                                    </span>
                                                    {item.rating && (
                                                         <div className="flex items-center gap-0.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                                            <span>{item.rating}</span>
                                                            <span className="text-gray-300">({item.votes})</span>
                                                         </div>
                                                    )}
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-2">{item.description}</p>
                                            </div>

                                            <div className="relative w-28 sm:w-40 flex flex-col items-center shrink-0">
                                                <div className="w-28 h-24 sm:w-40 sm:h-32 rounded-xl overflow-hidden shadow-sm relative bg-gray-100 dark:bg-gray-800">
                                                    {item.imageUrl ? (
                                                        <img 
                                                            src={item.imageUrl} 
                                                            alt={item.name} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                                            <Compass className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div 
                                                    className="absolute -bottom-2 sm:-bottom-3 w-20 sm:w-28 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                                                    onClick={(e) => e.stopPropagation()} 
                                                >
                                                    {qty === 0 ? (
                                                        <button 
                                                            onClick={() => {
                                                                if (item.variants) setSelectedDish(item); 
                                                                else onAddToCart(item, restaurant.id);
                                                            }}
                                                            className="w-full py-1.5 sm:py-2 text-purple-600 dark:text-purple-400 font-extrabold text-xs sm:text-sm uppercase hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
                                                        >
                                                            Add
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center justify-between bg-white dark:bg-gray-800">
                                                            <button 
                                                                onClick={() => onRemoveFromCart(item.id, restaurant.id)} 
                                                                className="px-2 py-1.5 sm:py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 hover:text-purple-600 transition"
                                                            >
                                                                <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                            </button>
                                                            <span className="font-bold text-purple-600 dark:text-purple-400 text-xs sm:text-sm">{qty}</span>
                                                            <button 
                                                                onClick={() => {
                                                                    if (item.variants) setSelectedDish(item);
                                                                    else onAddToCart(item, restaurant.id);
                                                                }}
                                                                className="px-2 py-1.5 sm:py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 hover:text-purple-600 transition"
                                                            >
                                                                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {item.variants && (
                                                    <span className="absolute bottom-[-22px] text-[9px] text-gray-400 font-medium">Customisable</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                     );
                })}
            </div>
         </div>

      </div>
      
      {/* Floating Bottom Cart Bar */}
      {isCartVisible && (
          <div className="fixed bottom-0 left-0 right-0 z-[55] p-4 flex justify-center animate-in slide-in-from-bottom-5">
              <div 
                  onClick={onOpenCart}
                  className="w-full max-w-3xl bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xl shadow-purple-900/20 py-3 px-5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                  <div className="flex flex-col">
                      <span className="text-[10px] sm:text-xs font-medium opacity-90 uppercase tracking-wide">{cartItemCount} ITEMS</span>
                      <div className="flex items-center gap-2">
                          <span className="font-bold text-base sm:text-lg">₹{cartTotal}</span>
                          <span className="text-xs opacity-80 line-through">₹{cartTotal + 50}</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-sm sm:text-lg">
                      View Cart <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 fill-white/20" />
                  </div>
              </div>
          </div>
      )}

      {selectedDish && (
          <DishDetailModal 
            item={selectedDish} 
            restaurantId={restaurant.id}
            onClose={() => setSelectedDish(null)}
            onAddToCart={onAddToCart}
          />
      )}
    </div>
  );
};