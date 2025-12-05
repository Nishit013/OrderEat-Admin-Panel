
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { AdminSettings } from '../types';
import { Save, TrendingUp, Truck } from 'lucide-react';

export const Finance: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
      taxRate: 5,
      deliveryBaseFee: 40,
      deliveryPerKm: 10,
      platformCommission: 20,
      freeDeliveryOrderValue: 500
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    db.ref('adminSettings').on('value', snap => {
        if(snap.exists()) setSettings(snap.val());
    });
  }, []);

  const handleSave = async () => {
      setLoading(true);
      // Ensure all values are valid numbers before saving
      const safeSettings: AdminSettings = {
          taxRate: isNaN(settings.taxRate) ? 5 : Number(settings.taxRate),
          deliveryBaseFee: isNaN(settings.deliveryBaseFee) ? 40 : Number(settings.deliveryBaseFee),
          deliveryPerKm: isNaN(settings.deliveryPerKm) ? 10 : Number(settings.deliveryPerKm),
          platformCommission: isNaN(settings.platformCommission) ? 20 : Number(settings.platformCommission),
          freeDeliveryOrderValue: isNaN(Number(settings.freeDeliveryOrderValue)) ? 0 : Number(settings.freeDeliveryOrderValue)
      };

      try {
        await db.ref('adminSettings').set(safeSettings);
        alert("Global financial settings updated!");
      } catch (e) {
        console.error("Error saving settings", e);
        alert("Failed to save settings.");
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Global Finance & Rates</h2>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Default Tax Rate (GST %)</label>
                    <input 
                        type="number" 
                        className="w-full border dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition outline-none focus:ring-2 focus:ring-purple-200"
                        value={settings.taxRate}
                        onChange={e => setSettings({...settings, taxRate: parseFloat(e.target.value)})}
                    />
                    <p className="text-xs text-gray-400 mt-1">Applied to all orders unless overridden by restaurant.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Base Delivery Fee (₹)</label>
                        <input 
                            type="number" 
                            className="w-full border dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition outline-none focus:ring-2 focus:ring-purple-200"
                            value={settings.deliveryBaseFee}
                            onChange={e => setSettings({...settings, deliveryBaseFee: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Per KM Rate (₹)</label>
                        <input 
                            type="number" 
                            className="w-full border dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition outline-none focus:ring-2 focus:ring-purple-200"
                            value={settings.deliveryPerKm}
                            onChange={e => setSettings({...settings, deliveryPerKm: parseFloat(e.target.value)})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Free Delivery Threshold (₹)</label>
                    <div className="relative">
                        <Truck className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input 
                            type="number" 
                            className="w-full border dark:border-gray-600 rounded-xl p-3 pl-10 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition outline-none focus:ring-2 focus:ring-purple-200"
                            value={settings.freeDeliveryOrderValue}
                            onChange={e => setSettings({...settings, freeDeliveryOrderValue: parseFloat(e.target.value)})}
                            placeholder="e.g. 500"
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Orders above this amount will have ₹0 delivery fee.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Default Platform Commission (%)</label>
                    <div className="relative">
                        <TrendingUp className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input 
                            type="number" 
                            className="w-full border dark:border-gray-600 rounded-xl p-3 pl-10 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition outline-none focus:ring-2 focus:ring-purple-200"
                            value={settings.platformCommission}
                            onChange={e => setSettings({...settings, platformCommission: parseFloat(e.target.value)})}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Percentage taken from restaurant subtotal.</p>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-purple-700 transition flex justify-center items-center gap-2"
                >
                    <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    </div>
  );
};
