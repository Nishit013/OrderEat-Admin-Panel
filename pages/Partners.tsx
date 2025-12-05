
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { DeliveryPartner, Order, AdminSettings, Restaurant } from '../types';
import { Bike, Phone, Trash2, CheckCircle, Ban, Car, Clock, User, FileText, MapPin, X, Calendar, DollarSign, History } from 'lucide-react';

export const Partners: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  
  // Data for Calculations (Fallback)
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  // Modal State
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
  const [partnerHistory, setPartnerHistory] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const partnerRef = db.ref('deliveryPartners');
    const settingsRef = db.ref('adminSettings');
    const restRef = db.ref('restaurants');

    partnerRef.on('value', snap => {
        if(snap.exists()) {
            setPartners(Object.keys(snap.val()).map(k => ({...snap.val()[k], id: k})));
        } else {
            setPartners([]);
        }
    });

    settingsRef.on('value', snap => {
        if(snap.exists()) setSettings(snap.val());
    });

    restRef.on('value', snap => {
        if(snap.exists()) {
            setRestaurants(Object.keys(snap.val()).map(k => ({...snap.val()[k], id: k})));
        }
    });

    return () => {
        partnerRef.off();
        settingsRef.off();
        restRef.off();
    };
  }, []);

  const toggleStatus = (e: React.MouseEvent, id: string, current: boolean) => {
      e.stopPropagation();
      db.ref(`deliveryPartners/${id}`).update({ isApproved: !current });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this partner?")) {
          db.ref(`deliveryPartners/${id}`).remove();
      }
  };

  const handlePartnerClick = async (partner: DeliveryPartner) => {
      setSelectedPartner(partner);
      setHistoryLoading(true);
      setPartnerHistory([]);

      try {
          const snap = await db.ref('orders').once('value');
          if (snap.exists()) {
              const allOrders = Object.values(snap.val()) as Order[];
              // Filter orders delivered by this partner
              const history = allOrders
                .filter(o => o.deliveryPartner?.id === partner.id && o.status === 'DELIVERED')
                .sort((a,b) => b.createdAt - a.createdAt);
              setPartnerHistory(history);
          }
      } catch (e) {
          console.error("Error fetching history", e);
      } finally {
          setHistoryLoading(false);
      }
  };

  const getVehicleIcon = (type: string) => {
      if (type === 'Bike' || type === 'Scooter') return <Bike className="w-4 h-4"/>;
      return <Car className="w-4 h-4"/>;
  };

  const formatDuration = (ms: number | undefined) => {
      if (!ms) return '0h 0m';
      const totalMinutes = Math.floor(ms / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
  };

  // Calculate Total Earnings dynamically using partnerPayout
  const calculateTotalEarnings = () => {
      if (partnerHistory.length === 0) return 0;

      return partnerHistory.reduce((acc, order) => {
          // Primary: Use stored payout
          if (order.partnerPayout !== undefined) {
              return acc + order.partnerPayout;
          }
          
          // Fallback: Calculate based on settings if payout missing (legacy data)
          const rest = restaurants.find(r => r.id === order.restaurantId);
          const fee = rest?.customDeliveryFee ?? settings?.deliveryBaseFee ?? 40;
          return acc + fee;
      }, 0);
  };

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Delivery Fleet Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.length === 0 && <p className="text-gray-400">No delivery partners registered.</p>}
            {partners.map(p => (
                <div 
                    key={p.id} 
                    onClick={() => handlePartnerClick(p)}
                    className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full rounded-full object-cover" alt={p.name}/> : <Bike className="w-6 h-6 text-gray-400"/>}
                                </div>
                                {/* Status Indicator Dot */}
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-gray-800 rounded-full ${p.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
                                    {p.isOnline && <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-purple-600 transition">{p.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{p.phone}</p>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${p.isApproved ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                            {p.isApproved ? 'Approved' : 'Pending'}
                        </span>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl mb-4 text-sm space-y-2 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">Status</span>
                            {p.isOnline ? (
                                <span className="font-bold text-green-600 dark:text-green-400 text-xs uppercase flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live Now
                                </span>
                            ) : (
                                <span className="font-bold text-gray-400 text-xs uppercase flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div> Offline
                                </span>
                            )}
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">Active Today</span>
                            <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-purple-500"/> {formatDuration(p.dailyActiveMs)}
                            </span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Vehicle</span>
                            <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1">
                                {getVehicleIcon(p.vehicleType)} {p.vehicleType}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Plate No.</span>
                            <span className="font-bold text-gray-700 dark:text-gray-200 uppercase">{p.vehicleNumber}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {p.isApproved ? (
                            <button onClick={(e) => toggleStatus(e, p.id, true)} className="w-full py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-50 dark:hover:bg-red-900/20 text-sm transition">
                                Suspend
                            </button>
                        ) : (
                            <div className="flex gap-2 w-full">
                                <button onClick={(e) => toggleStatus(e, p.id, false)} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 text-sm transition shadow-sm">
                                    Approve
                                </button>
                                <button onClick={(e) => handleDelete(e, p.id)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition">
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* --- PARTNER DETAILS MODAL --- */}
        {selectedPartner && (
            <div className="fixed inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPartner(null)}></div>
                <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex justify-between items-start shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 p-1 shadow-md border border-gray-100 dark:border-gray-700">
                                <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                     {selectedPartner.imageUrl ? <img src={selectedPartner.imageUrl} className="w-full h-full object-cover" alt="" /> : <User className="w-full h-full p-3 text-gray-400"/>}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white">{selectedPartner.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${selectedPartner.isOnline ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}>
                                        {selectedPartner.isOnline ? 'Online Now' : 'Offline'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3"/> Joined {new Date(selectedPartner.joinedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedPartner(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
                            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                        
                        {/* Stats Row */}
                        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
                            <div className="p-4 text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Deliveries</p>
                                <p className="text-2xl font-black text-gray-800 dark:text-white">{historyLoading ? '...' : partnerHistory.length}</p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Today's Active Time</p>
                                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{formatDuration(selectedPartner.dailyActiveMs)}</p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Lifetime Earnings</p>
                                <p className="text-2xl font-black text-green-600 dark:text-green-400">
                                    {historyLoading ? '...' : `₹${calculateTotalEarnings().toLocaleString()}`}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            
                            {/* Personal & Vehicle Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-500"/> Personal Details
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-950/50 p-4 rounded-xl space-y-3 border border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Phone</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedPartner.phone}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Email</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedPartner.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">UPI ID</span>
                                            <span className="font-mono font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                                {selectedPartner.upiId || 'Not Linked'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                        <Bike className="w-4 h-4 text-gray-500"/> Vehicle Info
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-950/50 p-4 rounded-xl space-y-3 border border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Type</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                                {getVehicleIcon(selectedPartner.vehicleType)} {selectedPartner.vehicleType}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Plate Number</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200 uppercase">{selectedPartner.vehicleNumber}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">License No.</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200 uppercase">{selectedPartner.licenseNumber || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery History */}
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                    <History className="w-4 h-4 text-gray-500"/> Delivery History
                                </h3>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="p-3">Date</th>
                                                <th className="p-3">Restaurant</th>
                                                <th className="p-3 text-right">Order Value</th>
                                                <th className="p-3 text-right text-green-600">Partner Fee</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                            {historyLoading ? (
                                                <tr><td colSpan={4} className="p-4 text-center">Loading history...</td></tr>
                                            ) : partnerHistory.length === 0 ? (
                                                <tr><td colSpan={4} className="p-4 text-center text-gray-400">No deliveries yet.</td></tr>
                                            ) : (
                                                partnerHistory.map(order => {
                                                    const fee = order.partnerPayout ?? 0;
                                                    return (
                                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                            <td className="p-3">
                                                                <div className="font-medium text-gray-800 dark:text-gray-200">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                                <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</div>
                                                            </td>
                                                            <td className="p-3 text-gray-600 dark:text-gray-300">{order.restaurantName}</td>
                                                            <td className="p-3 text-right text-gray-500">₹{order.totalAmount}</td>
                                                            <td className="p-3 text-right font-bold text-green-600 dark:text-green-400">
                                                                +₹{fee}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-3 shrink-0">
                         {selectedPartner.isApproved && (
                             <button 
                                onClick={(e) => { toggleStatus(e, selectedPartner.id, true); setSelectedPartner(null); }}
                                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-lg border border-red-200 dark:border-red-900/30 hover:bg-red-100 transition text-sm"
                            >
                                <Ban className="w-4 h-4 inline mr-2"/> Suspend Partner
                            </button>
                         )}
                         <button 
                            onClick={() => setSelectedPartner(null)}
                            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm"
                        >
                            Close
                        </button>
                    </div>

                </div>
            </div>
        )}
    </div>
  );
};
