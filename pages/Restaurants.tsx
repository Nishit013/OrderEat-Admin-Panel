
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Restaurant, MenuItem, Order } from '../types';
import { Check, X, Megaphone, Power, EyeOff, ShieldCheck, AlertCircle, MapPin, Star, Calendar, TrendingUp, ShoppingBag, ArrowLeft, ChevronRight } from 'lucide-react';

export const Restaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);
  
  // Menu Modal
  const [showMenu, setShowMenu] = useState(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);

  // Restaurant Details Modal
  const [showDetails, setShowDetails] = useState(false);
  const [restStats, setRestStats] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  
  useEffect(() => {
    const ref = db.ref('restaurants');
    const listener = ref.on('value', (snap) => {
        if (snap.exists()) {
            const list = Object.keys(snap.val()).map(k => ({...snap.val()[k], id: k}));
            setRestaurants(list);
        } else {
            setRestaurants([]);
        }
        setLoading(false);
    });
    return () => ref.off('value', listener);
  }, []);

  const toggleListingStatus = (id: string, currentStatus: boolean = false) => {
      if (currentStatus) {
          if (!window.confirm("Unlisting this restaurant will hide it from the user app immediately. Are you sure?")) return;
      }
      db.ref(`restaurants/${id}`).update({ isApproved: !currentStatus });
  };

  const togglePromote = (id: string, current: boolean = false) => {
      db.ref(`restaurants/${id}`).update({ promoted: !current });
  };

  // Open Restaurant Details Modal and Fetch Stats
  const openRestaurantDetails = async (r: Restaurant) => {
      setSelectedRest(r);
      setShowDetails(true);
      setStatsLoading(true);

      try {
        // Fetch all orders and filter client-side to avoid "Index not defined" warning
        const ordersSnap = await db.ref('orders').once('value');
        let count = 0;
        let revenue = 0;
        
        if (ordersSnap.exists()) {
            const allOrders = Object.values(ordersSnap.val()) as Order[];
            // Filter orders for this specific restaurant
            const validOrders = allOrders.filter(o => o.restaurantId === r.id && o.status !== 'CANCELLED');
            
            count = validOrders.length;
            revenue = validOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        }
        setRestStats({ totalOrders: count, totalRevenue: revenue });
      } catch (e) {
          console.error("Error fetching stats", e);
      } finally {
          setStatsLoading(false);
      }
  };

  const closeMenuModal = () => {
      setShowMenu(false);
      setSelectedDish(null);
      setSelectedRest(null);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Restaurant Management</h2>
            <p className="text-sm text-gray-500">Manage approvals, listings, and view menus.</p>
        </div>
        <span className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
            {restaurants.length} Partners Onboarded
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
                    <tr>
                        <th className="p-4">Restaurant Details</th>
                        <th className="p-4">Operational</th>
                        <th className="p-4">Platform Listing</th>
                        <th className="p-4 text-center">Sponsored</th>
                        <th className="p-4 text-center">Menu</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                    {restaurants.map(r => {
                        const isListed = r.isApproved;
                        return (
                            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                                            <img src={r.imageUrl} className="w-full h-full object-cover" alt={r.name}/>
                                        </div>
                                        <div>
                                            <button 
                                                onClick={() => openRestaurantDetails(r)}
                                                className="font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 hover:underline text-left"
                                            >
                                                {r.name}
                                            </button>
                                            <p className="text-xs text-gray-500 truncate w-48">{r.address}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {/* Operational Status (Restaurant Controlled) */}
                                    {r.isOnline ? (
                                        <div className="flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200 dark:border-green-900/30 w-fit">
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            Live
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 w-fit">
                                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                            Offline
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    {/* Admin Listing Control */}
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                        isListed 
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                    }`}>
                                        {isListed ? <ShieldCheck className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
                                        {isListed ? 'Listed' : 'Unlisted'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => togglePromote(r.id, r.promoted)}
                                        className={`p-1.5 rounded-full transition ${r.promoted ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                        title="Toggle Sponsored Tag"
                                    >
                                        <Megaphone className="w-4 h-4" />
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => { setSelectedRest(r); setShowMenu(true); }} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                        View Items
                                    </button>
                                </td>
                                <td className="p-4 text-right">
                                    {isListed ? (
                                        <button 
                                            onClick={() => toggleListingStatus(r.id, true)}
                                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900/30 transition flex items-center gap-2 ml-auto"
                                        >
                                            <EyeOff className="w-3.5 h-3.5" /> Unlist
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => toggleListingStatus(r.id, false)}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-green-200 dark:shadow-none transition flex items-center gap-2 ml-auto"
                                        >
                                            <Check className="w-3.5 h-3.5" /> Approve & List
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {restaurants.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No restaurants found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
      
      {/* --- RESTAURANT DETAILS MODAL --- */}
      {showDetails && selectedRest && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Header Image */}
                  <div className="h-40 bg-gray-200 relative shrink-0">
                      <img src={selectedRest.imageUrl} alt={selectedRest.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <button 
                        onClick={() => setShowDetails(false)} 
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition"
                      >
                          <X className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-4 left-6 text-white">
                          <h2 className="text-3xl font-black italic tracking-tight">{selectedRest.name}</h2>
                          <p className="opacity-90 text-sm flex items-center gap-2">
                             <MapPin className="w-4 h-4"/> {selectedRest.address}
                          </p>
                      </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 overflow-y-auto">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-8">
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Total Orders</p>
                              <h3 className="text-2xl font-black text-gray-800 dark:text-white flex items-center justify-center gap-2">
                                  {statsLoading ? '...' : restStats.totalOrders}
                                  <ShoppingBag className="w-5 h-5 text-purple-500"/>
                              </h3>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Total Revenue</p>
                              <h3 className="text-2xl font-black text-gray-800 dark:text-white flex items-center justify-center gap-2">
                                  {statsLoading ? '...' : `₹${restStats.totalRevenue.toLocaleString()}`}
                                  <TrendingUp className="w-5 h-5 text-green-500"/>
                              </h3>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Rating</p>
                              <h3 className="text-2xl font-black text-gray-800 dark:text-white flex items-center justify-center gap-2">
                                  {selectedRest.rating.toFixed(1)}
                                  <Star className="w-5 h-5 text-yellow-500 fill-current"/>
                              </h3>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Additional Info</h4>
                          <div className="grid grid-cols-2 gap-6 text-sm">
                              <div>
                                  <p className="text-gray-500 dark:text-gray-400 mb-1">Cuisines</p>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">{(selectedRest.cuisine || []).join(', ')}</p>
                              </div>
                              <div>
                                  <p className="text-gray-500 dark:text-gray-400 mb-1">Price for Two</p>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">₹{selectedRest.priceForTwo}</p>
                              </div>
                              <div>
                                  <p className="text-gray-500 dark:text-gray-400 mb-1">Delivery Time</p>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">{selectedRest.deliveryTime}</p>
                              </div>
                              <div>
                                  <p className="text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                  <div className="flex gap-2">
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${selectedRest.isApproved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                          {selectedRest.isApproved ? 'Listed' : 'Unlisted'}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${selectedRest.isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                          {selectedRest.isOnline ? 'Online' : 'Offline'}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- MENU VIEWER MODAL --- */}
      {showMenu && selectedRest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
              <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl h-[85vh] flex flex-col overflow-hidden relative">
                  
                  {/* Modal Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                      {selectedDish ? (
                          <div className="flex items-center gap-2">
                              <button onClick={() => setSelectedDish(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                              </button>
                              <h3 className="font-bold text-lg text-gray-800 dark:text-white">Back to Menu</h3>
                          </div>
                      ) : (
                          <div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Menu: {selectedRest.name}</h3>
                            <p className="text-xs text-gray-500">{Object.keys(selectedRest.menu || {}).length} items listed</p>
                          </div>
                      )}
                      
                      <button 
                        onClick={closeMenuModal} 
                        className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition"
                      >
                          <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 p-4">
                      
                      {selectedDish ? (
                          /* --- DISH DETAIL VIEW --- */
                          <div className="animate-in slide-in-from-right duration-300">
                              <div className="h-64 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 mb-6 relative">
                                  <img src={selectedDish.imageUrl} alt={selectedDish.name} className="w-full h-full object-cover" />
                                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold shadow-md ${selectedDish.isVeg ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                      {selectedDish.isVeg ? 'VEG' : 'NON-VEG'}
                                  </div>
                              </div>
                              
                              <div className="space-y-4">
                                  <div className="flex justify-between items-start">
                                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedDish.name}</h2>
                                      <span className="text-xl font-bold text-purple-600 dark:text-purple-400">₹{selectedDish.price}</span>
                                  </div>
                                  
                                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                                      {selectedDish.description}
                                  </p>

                                  <div className="pt-4">
                                      <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                          <ShieldCheck className="w-5 h-5 text-green-500"/> Variants & Customizations
                                      </h4>
                                      
                                      {selectedDish.variants && selectedDish.variants.length > 0 ? (
                                          <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                                              <table className="w-full text-sm text-left">
                                                  <thead className="bg-gray-50 dark:bg-gray-900 font-bold text-gray-500 uppercase text-xs">
                                                      <tr>
                                                          <th className="p-3">Variant Name</th>
                                                          <th className="p-3 text-right">Price</th>
                                                      </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                      {selectedDish.variants.map((v, idx) => (
                                                          <tr key={idx} className="bg-white dark:bg-gray-800">
                                                              <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{v.name}</td>
                                                              <td className="p-3 text-right font-bold text-purple-600 dark:text-purple-400">₹{v.price}</td>
                                                          </tr>
                                                      ))}
                                                  </tbody>
                                              </table>
                                          </div>
                                      ) : (
                                          <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
                                              No variants available for this item.
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ) : (
                          /* --- DISH LIST VIEW --- */
                          <div className="space-y-3">
                              {Object.values(selectedRest.menu || {}).length === 0 && (
                                  <div className="text-center py-20 text-gray-400">
                                      <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                                      <p>No menu items found.</p>
                                  </div>
                              )}
                              {Object.values(selectedRest.menu || {}).map((item: any) => (
                                  <div 
                                    key={item.id} 
                                    onClick={() => setSelectedDish(item)}
                                    className="flex gap-4 border border-gray-100 dark:border-gray-700 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition cursor-pointer group"
                                  >
                                      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt=""/>
                                      </div>
                                      <div className="flex-1">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 border flex items-center justify-center rounded-sm shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                                </div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{item.name}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition"/>
                                          </div>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">₹{item.price} • {item.category}</p>
                                          {item.variants && <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded mt-1 inline-block">{item.variants.length} Variants</span>}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
