import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { Restaurant, MenuItem } from '../../types';
import { Check, X, Star, Eye, Shield, Megaphone, Settings, Trash2, AlertCircle } from 'lucide-react';

export const RestaurantManager: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
      customTax: '',
      customDelivery: '',
      commission: ''
  });

  // Menu Modal State
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const ref = db.ref('restaurants');
    const listener = ref.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.keys(data).map(key => ({...data[key], id: key}));
            setRestaurants(list);
        } else {
            setRestaurants([]);
        }
        setLoading(false);
    });
    return () => ref.off('value', listener);
  }, []);

  const toggleApproval = (id: string, currentStatus: boolean | undefined) => {
      if (!currentStatus && !window.confirm("Approve this restaurant to go live?")) return;
      db.ref(`restaurants/${id}`).update({ isApproved: !currentStatus });
  };

  const togglePromotion = (id: string, currentStatus: boolean | undefined) => {
      db.ref(`restaurants/${id}`).update({ promoted: !currentStatus });
  };

  const handleDelete = (id: string) => {
      if (window.confirm("Are you sure? This will delete the restaurant and all its menu items permanently.")) {
          db.ref(`restaurants/${id}`).remove();
      }
  };

  const openSettings = (r: Restaurant) => {
      setSelectedRest(r);
      setSettingsForm({
          customTax: r.customTaxRate?.toString() || '',
          customDelivery: r.customDeliveryFee?.toString() || '',
          commission: r.commissionRate?.toString() || ''
      });
      setShowSettings(true);
  };

  const saveSettings = async () => {
      if (!selectedRest) return;
      await db.ref(`restaurants/${selectedRest.id}`).update({
          customTaxRate: settingsForm.customTax ? parseFloat(settingsForm.customTax) : null,
          customDeliveryFee: settingsForm.customDelivery ? parseFloat(settingsForm.customDelivery) : null,
          commissionRate: settingsForm.commission ? parseFloat(settingsForm.commission) : null
      });
      setShowSettings(false);
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Restaurant Management</h2>
            <div className="text-sm text-gray-500">
                Total: <span className="font-bold text-gray-800 dark:text-white">{restaurants.length}</span>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Restaurant</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Sponsored</th>
                            <th className="p-4 text-center">Settings</th>
                            <th className="p-4 text-center">Menu</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {restaurants.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={r.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-gray-200" alt="" />
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{r.name}</p>
                                            <p className="text-xs text-gray-400 truncate w-40">{r.address}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => toggleApproval(r.id, r.isApproved)}
                                        className={`px-2 py-1 rounded text-xs font-bold uppercase border ${r.isApproved ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}
                                    >
                                        {r.isApproved ? 'Live' : 'Pending'}
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => togglePromotion(r.id, r.promoted)}
                                        className={`p-1.5 rounded-full transition ${r.promoted ? 'bg-purple-100 text-purple-600' : 'text-gray-300 hover:text-gray-500'}`}
                                    >
                                        <Megaphone className="w-4 h-4" />
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => openSettings(r)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => { setSelectedRest(r); setShowMenu(true); }}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        View ({Object.keys(r.menu || {}).length})
                                    </button>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(r.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Financial Settings Modal */}
        {showSettings && selectedRest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{selectedRest.name}</h3>
                    <p className="text-sm text-gray-500 mb-6">Override global financial settings for this restaurant.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">GST / Tax Rate (%)</label>
                            <input 
                                type="number" 
                                placeholder="Global Default" 
                                className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={settingsForm.customTax}
                                onChange={e => setSettingsForm({...settingsForm, customTax: e.target.value})}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Leave empty to use global tax rate.</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Base Delivery Fee (₹)</label>
                            <input 
                                type="number" 
                                placeholder="Global Default" 
                                className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={settingsForm.customDelivery}
                                onChange={e => setSettingsForm({...settingsForm, customDelivery: e.target.value})}
                            />
                             <p className="text-[10px] text-gray-400 mt-1">Leave empty to use global base fee.</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Commission Rate (%)</label>
                            <input 
                                type="number" 
                                placeholder="Standard 20%" 
                                className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={settingsForm.commission}
                                onChange={e => setSettingsForm({...settingsForm, commission: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => setShowSettings(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg font-bold">Cancel</button>
                        <button onClick={saveSettings} className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-bold">Save Changes</button>
                    </div>
                </div>
            </div>
        )}

        {/* Menu Viewer Modal */}
        {showMenu && selectedRest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl h-[80vh] flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Menu: {selectedRest.name}</h3>
                        <button onClick={() => setShowMenu(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"><X className="w-5 h-5 dark:text-white" /></button>
                     </div>
                     <div className="flex-1 overflow-y-auto space-y-3">
                         {Object.values(selectedRest.menu || {}).length === 0 && (
                             <div className="text-center py-20 text-gray-400">
                                 <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                                 <p>No menu items found.</p>
                             </div>
                         )}
                         {Object.values(selectedRest.menu || {}).map((item: any) => (
                             <div key={item.id} className="flex gap-4 p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                                 <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                                     <img src={item.imageUrl} className="w-full h-full object-cover" alt=""/>
                                 </div>
                                 <div>
                                     <p className="font-bold text-gray-800 dark:text-white">{item.name}</p>
                                     <p className="text-sm text-gray-500">₹{item.price} • {item.category}</p>
                                     {item.isVeg ? <span className="text-[10px] text-green-600 font-bold border border-green-200 px-1 rounded">VEG</span> : <span className="text-[10px] text-red-600 font-bold border border-red-200 px-1 rounded">NON-VEG</span>}
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};