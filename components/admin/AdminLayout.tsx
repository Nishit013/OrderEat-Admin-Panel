import React, { useState } from 'react';
import { LayoutDashboard, Store, Users, ShoppingBag, Settings, Megaphone, LogOut, Menu, Bike, TrendingUp, BarChart2 } from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { RestaurantManager } from './RestaurantManager';
import { OrderManager } from './OrderManager';
import { ContentManager } from './ContentManager';
import { FinanceSettings } from './FinanceSettings';
import { PartnerManager } from './PartnerManager';
import { CRM } from './CRM';
import { Analytics } from '../../pages/Analytics';
import { UserProfile } from '../../types';

interface AdminLayoutProps {
  user: UserProfile;
  onLogout: () => void;
  onSwitchToUser: () => void;
}

type Tab = 'dashboard' | 'restaurants' | 'partners' | 'orders' | 'crm' | 'content' | 'settings' | 'analytics';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout, onSwitchToUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'restaurants', label: 'Restaurants', icon: Store },
    { id: 'partners', label: 'Delivery Partners', icon: Bike },
    { id: 'orders', label: 'Orders & Payments', icon: ShoppingBag },
    { id: 'crm', label: 'User CRM', icon: Users },
    { id: 'content', label: 'Content & Ads', icon: Megaphone },
    { id: 'settings', label: 'Finance & Rates', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex font-sans">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static shrink-0 shadow-2xl`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
            <div>
                <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    OrderEat
                </h1>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded ml-1">Admin</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400"><Menu/></button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-180px)]">
            {menuItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as Tab); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === item.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800 bg-gray-950">
            <button onClick={onSwitchToUser} className="w-full mb-3 text-xs font-bold text-center text-gray-400 hover:text-white py-2 border border-gray-800 hover:border-gray-600 rounded-lg transition">
                Switch to User App
            </button>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-900/20 py-2 rounded-lg transition text-sm font-bold">
                <LogOut className="w-4 h-4" /> Logout
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white dark:bg-gray-900 shadow-sm flex items-center justify-between shrink-0">
            <h1 className="font-bold text-gray-800 dark:text-gray-100 text-lg capitalize">{activeTab}</h1>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Menu className="w-6 h-6 dark:text-white" />
            </button>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-100 dark:bg-gray-900">
            {activeTab === 'dashboard' && <DashboardStats />}
            {activeTab === 'restaurants' && <RestaurantManager />}
            {activeTab === 'partners' && <PartnerManager />}
            {activeTab === 'orders' && <OrderManager />}
            {activeTab === 'crm' && <CRM />}
            {activeTab === 'content' && <ContentManager />}
            {activeTab === 'settings' && <FinanceSettings />}
            {activeTab === 'analytics' && <Analytics />}
        </div>
      </main>
    </div>
  );
};