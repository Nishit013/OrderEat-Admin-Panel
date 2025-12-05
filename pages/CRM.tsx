import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { UserProfile, Order } from '../types';
import { User, MapPin, X, Package, Calendar, Phone, Mail, Clock, ChevronRight } from 'lucide-react';

export const CRM: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    db.ref('users').on('value', snap => {
        if(snap.exists()) {
            const usersList = Object.keys(snap.val()).map(key => ({
                ...snap.val()[key],
                uid: key // Ensure uid is present from key if not in object
            }));
            setUsers(usersList);
        }
    });
  }, []);

  const handleUserClick = async (user: UserProfile) => {
    setSelectedUser(user);
    setLoadingOrders(true);
    setUserOrders([]);

    // Fetch orders for this user
    try {
        // Fetch all orders and filter client-side to avoid "Index not defined" warning
        const ordersSnap = await db.ref('orders').once('value');
        if (ordersSnap.exists()) {
            const allOrders = Object.values(ordersSnap.val()) as Order[];
            const filteredOrders = allOrders.filter(o => o.userId === user.uid);
            setUserOrders(filteredOrders.sort((a,b) => b.createdAt - a.createdAt));
        }
    } catch (e) {
        console.error("Error fetching user orders:", e);
    } finally {
        setLoadingOrders(false);
    }
  };

  const closeModal = () => {
      setSelectedUser(null);
      setUserOrders([]);
  };

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">User CRM</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 uppercase text-xs font-bold text-gray-500">
                    <tr>
                        <th className="p-4">User Info</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Addresses</th>
                        <th className="p-4">Joined</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {users.map((u, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                        {u.name ? u.name[0].toUpperCase() : <User className="w-5 h-5"/>}
                                    </div>
                                    <span className="font-bold text-gray-800">{u.name || 'Anonymous'}</span>
                                </div>
                            </td>
                            <td className="p-4 text-gray-600">
                                {u.email}<br/>{u.phone}
                            </td>
                            <td className="p-4 text-gray-500">
                                {u.addresses?.length || 0} saved addresses
                            </td>
                            <td className="p-4 text-gray-400">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleUserClick(u)}
                                    className="text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Customer Details Modal */}
        {selectedUser && (
            <div className="fixed inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal}></div>
                <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    
                    {/* Header */}
                    <div className="p-6 bg-gray-900 text-white shrink-0">
                         <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold">Customer Profile</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-full transition"><X className="w-5 h-5"/></button>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-1">
                                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold">
                                    {selectedUser.name ? selectedUser.name[0].toUpperCase() : <User/>}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{selectedUser.name || 'Anonymous User'}</h3>
                                <p className="text-gray-400 text-sm flex items-center gap-2"><Mail className="w-3 h-3"/> {selectedUser.email}</p>
                                {selectedUser.phone && <p className="text-gray-400 text-sm flex items-center gap-2"><Phone className="w-3 h-3"/> {selectedUser.phone}</p>}
                            </div>
                         </div>
                         <div className="mt-4 pt-4 border-t border-gray-700 flex gap-6 text-sm">
                             <div>
                                 <p className="text-gray-400 text-xs uppercase mb-1">Joined On</p>
                                 <p className="font-bold">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}</p>
                             </div>
                             <div>
                                 <p className="text-gray-400 text-xs uppercase mb-1">Total Orders</p>
                                 <p className="font-bold">{loadingOrders ? '...' : userOrders.length}</p>
                             </div>
                             <div>
                                 <p className="text-gray-400 text-xs uppercase mb-1">Total Spent</p>
                                 <p className="font-bold text-green-400">
                                     {loadingOrders ? '...' : `₹${userOrders.filter(o => o.status !== 'CANCELLED').reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}`}
                                 </p>
                             </div>
                         </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
                        
                        {/* Address Book */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4"/> Saved Addresses
                            </h3>
                            <div className="space-y-3">
                                {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                                    selectedUser.addresses.map((addr) => (
                                        <div key={addr.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-gray-800 text-sm">{addr.type}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{addr.houseNo}, {addr.area}</p>
                                            {addr.landmark && <p className="text-xs text-gray-400 mt-1">{addr.landmark}</p>}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No addresses saved.</p>
                                )}
                            </div>
                        </div>

                        {/* Order History */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4"/> Order History
                            </h3>
                            {loadingOrders ? (
                                <div className="text-center py-4 text-gray-400">Loading orders...</div>
                            ) : userOrders.length > 0 ? (
                                <div className="space-y-3">
                                    {userOrders.map((order) => (
                                        <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{order.restaurantName}</h4>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-3 h-3"/> {new Date(order.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
                                                <p className="text-xs text-gray-500">{order.items.length} items</p>
                                                <p className="font-bold text-purple-600 text-sm">₹{order.totalAmount}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No orders found.</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        )}
    </div>
  );
};