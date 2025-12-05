import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Restaurants } from './pages/Restaurants';
import { Partners } from './pages/Partners';
import { Orders } from './pages/Orders';
import { CRM } from './pages/CRM';
import { Marketing } from './pages/Marketing';
import { Finance } from './pages/Finance';
import { Analytics } from './pages/Analytics';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('adminTheme');
        return saved === 'dark';
    }
    return false;
  });

  // Apply Theme Side Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('adminTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('adminTheme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-500">Loading...</div>;

  if (!user) return <Login />;

  const renderContent = () => {
      switch(activeTab) {
          case 'dashboard': return <Dashboard />;
          case 'analytics': return <Analytics />;
          case 'restaurants': return <Restaurants />;
          case 'partners': return <Partners />;
          case 'orders': return <Orders />;
          case 'crm': return <CRM />;
          case 'marketing': return <Marketing />;
          case 'finance': return <Finance />;
          default: return <Dashboard />;
      }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
      <main className="flex-1 ml-64 overflow-y-auto p-8 bg-gray-100 dark:bg-gray-900">
          {renderContent()}
      </main>
    </div>
  );
}