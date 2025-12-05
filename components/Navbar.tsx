import React from 'react';
import { Search, ShoppingBag, User, MapPin, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  cartCount: number;
  onCartClick: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
  onProfileClick: () => void;
  locationName?: string;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onAddressClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  cartCount, 
  onCartClick, 
  onLogout, 
  onLoginClick,
  onProfileClick,
  locationName = "New Delhi",
  searchQuery = "",
  onSearch,
  onAddressClick
}) => {
  return (
    <div className="bg-white dark:bg-gray-950 shadow-sm border-b border-gray-100 dark:border-gray-800 font-sans sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-0">
        <div className="flex flex-col md:flex-row md:items-center md:h-20 gap-4 md:gap-8">
          
          {/* Top Row on Mobile: Logo + Actions */}
          <div className="flex justify-between items-center w-full md:w-auto">
            {/* Logo */}
            <div className="flex items-center gap-1 shrink-0">
              <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                OrderEat
              </h1>
            </div>

            {/* Mobile Actions (Profile/Login) */}
            <div className="flex md:hidden items-center space-x-4">
              {user ? (
                <button 
                  onClick={onProfileClick}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center text-purple-700 border border-purple-200"
                >
                  <User className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={onLoginClick}
                  className="text-sm font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1.5 rounded-full"
                >
                  Log in
                </button>
              )}
            </div>
          </div>

          {/* Search & Location Container - Full width on mobile, Flex on desktop */}
          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl h-12 px-2 w-full md:max-w-3xl transition-colors">
            {/* Location */}
            <div 
              onClick={onAddressClick}
              className="flex items-center px-2 cursor-pointer border-r border-gray-200 dark:border-gray-700 w-[35%] md:w-1/3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-lg transition group"
            >
              <MapPin className="w-5 h-5 text-purple-500 mr-1 md:mr-2 shrink-0 group-hover:animate-bounce" />
              <div className="flex flex-col justify-center overflow-hidden">
                <span className="text-gray-900 dark:text-gray-100 text-xs md:text-sm font-medium truncate" title={locationName}>{locationName}</span>
              </div>
              <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400 ml-auto hidden sm:block" />
            </div>

            {/* Search Input */}
            <div className="flex-1 flex items-center px-2 md:px-4">
              <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearch?.(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 text-xs md:text-sm font-medium truncate"
                placeholder="Search restaurant or dish..."
              />
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-6 shrink-0 ml-auto">
            {user ? (
              <div className="flex items-center gap-4">
                 <button 
                  onClick={onProfileClick}
                  className="flex items-center text-gray-700 hover:text-purple-600 font-medium transition gap-2"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center text-purple-700 border border-purple-200">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="hidden lg:block text-sm font-semibold text-gray-800 dark:text-gray-200">{user.name?.split(' ')[0] || 'User'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-6 text-lg">
                <button 
                  onClick={onLoginClick}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-normal"
                >
                  Log in
                </button>
                <button 
                  onClick={onLoginClick}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-normal"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Sub-header / Tabs - Hidden on mobile, visible on tablet+ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden md:block">
          <div className="flex items-center gap-10">
              <div className="flex items-center gap-3 py-4 border-b-2 border-purple-600 cursor-pointer">
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded-full">
                      <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-purple-600 dark:text-purple-400 font-bold text-lg">Delivery</h3>
              </div>
              <div className="flex items-center gap-3 py-4 border-b-2 border-transparent cursor-pointer opacity-60 hover:opacity-100 transition">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                      <img src="https://b.zmtcdn.com/data/o2_assets/78d25215ff4c1299578ed36eefd5f39d1616149985.png" alt="Dining" className="w-5 h-5 grayscale invert dark:invert-0" />
                  </div>
                  <h3 className="text-gray-700 dark:text-gray-300 font-medium text-lg">Dining Out</h3>
              </div>
              <div className="flex items-center gap-3 py-4 border-b-2 border-transparent cursor-pointer opacity-60 hover:opacity-100 transition">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                      <img src="https://b.zmtcdn.com/data/o2_assets/01040767e4943c398e38e3592bb1ba8a1616150142.png" alt="Nightlife" className="w-5 h-5 grayscale invert dark:invert-0" />
                  </div>
                  <h3 className="text-gray-700 dark:text-gray-300 font-medium text-lg">Nightlife</h3>
              </div>
          </div>
      </div>
    </div>
  );
};