import React from 'react';
import { LayoutDashboard, Store, ShoppingBag, Users, Bike, TrendingUp, Megaphone, LogOut, BarChart2, Moon, Sun } from 'lucide-react';
import { auth } from '../firebase';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isDarkMode, toggleTheme }) => {
  const menu = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'restaurants', label: 'Restaurants', icon: Store },
    { id: 'partners', label: 'Delivery Fleet', icon: Bike },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'crm', label: 'Users CRM', icon: Users },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'finance', label: 'Finance & Rates', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 bg-admin-900 text-white flex flex-col fixed h-full shadow-2xl z-20 transition-colors duration-300">
      <div className="p-6 border-b border-gray-800 bg-black/20">
        <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">OrderEat</h1>
        <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Online</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === item.id 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 border border-purple-500' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-gray-500'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 bg-black/20 border-t border-gray-800 space-y-3">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition text-sm font-medium text-gray-300 border border-gray-700 hover:border-gray-600"
        >
            <span className="flex items-center gap-2">
                {isDarkMode ? <Moon className="w-4 h-4 text-purple-400"/> : <Sun className="w-4 h-4 text-yellow-400"/>}
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-purple-600' : 'bg-gray-600'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
        </button>

        <button 
          onClick={() => auth.signOut()}
          className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-900/20 py-3 rounded-xl transition text-sm font-bold border border-transparent hover:border-red-900/30"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
};