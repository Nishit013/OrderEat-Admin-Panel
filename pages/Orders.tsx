import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Order, OrderStatus, UserProfile } from '../types';
import { Clock, CheckCircle, Ban, CreditCard, Banknote, Search, Filter, X, User, MapPin, Store, Bike, Phone, Calendar, ChevronRight, Mail } from 'lucide-react';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const ref = db.ref('orders');
    ref.on('value', snap => {
        if(snap.exists()) {
            const list = Object.values(snap.val()).sort((a: any, b: any) => b.createdAt - a.createdAt) as Order[];
            setOrders(list);
            setFilteredOrders(list);
        } else {
            setOrders([]);
            setFilteredOrders([]);
        }
    });
    return () => ref.off();
  }, []);

  // Fetch Customer Details when Order is selected
  useEffect(() => {
    if (selectedOrder && selectedOrder.userId) {
        setCustomer(null); // Reset previous customer
        db.ref(`users/${selectedOrder.userId}`).once('value').then(snapshot => {
            if (snapshot.exists()) {
                setCustomer(snapshot.val());
            }
        });
    } else {
        setCustomer(null);
    }
  }, [selectedOrder]);

  useEffect(() => {
    let result = orders;

    // Filter by Status
    if (statusFilter !== 'ALL') {
        result = result.filter(o => o.status === statusFilter);
    }

    // Filter by Search (Order ID, Restaurant Name, User ID)
    if (search) {
        const lowerSearch = search.toLowerCase();
        result = result.filter(o => 
            (o.id && o.id.toLowerCase().includes(lowerSearch)) ||
            (o.restaurantName && o.restaurantName.toLowerCase().includes(lowerSearch)) ||
            (o.userId && o.userId.toLowerCase().includes(lowerSearch))
        );
    }

    setFilteredOrders(result);
  }, [search, statusFilter, orders]);

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
          case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
          case 'PLACED': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-orange-100 text-orange-700 border-orange-200';
      }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Order History</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search ID, Restaurant..." 
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <select 
                        className="pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-purple-500 appearance-none bg-white dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-200"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Status</option>
                        <option value={OrderStatus.PLACED}>Placed</option>
                        <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                        <option value={OrderStatus.PREPARING}>Preparing</option>
                        <option value={OrderStatus.OUT_FOR_DELIVERY}>Out for Delivery</option>
                        <option value={OrderStatus.DELIVERED}>Delivered</option>
                        <option value={OrderStatus.CANCELLED}>Cancelled</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                        <tr>
                            <th className="p-4">Order ID / Date</th>
                            <th className="p-4">Customer & Restaurant</th>
                            <th className="p-4">Items</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Payment</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400">
                                    No orders found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((o) => (
                                <tr 
                                    key={o.id} 
                                    onClick={() => setSelectedOrder(o)}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group transition"
                                >
                                    <td className="p-4">
                                        <span className="font-mono text-xs text-gray-500 block mb-1">
                                            #{o.id ? o.id.slice(0,8) : 'N/A'}
                                        </span>
                                        <span className="font-bold text-gray-700 dark:text-gray-200">{new Date(o.createdAt).toLocaleDateString()}</span>
                                        <span className="text-xs text-gray-400 block">{new Date(o.createdAt).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{o.restaurantName || 'Unknown Restaurant'}</p>
                                        <p className="text-xs text-gray-500">User: {o.userId ? o.userId.slice(0,6) : 'Guest'}...</p>
                                    </td>
                                    <td className="p-4 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                        {(o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || 'No items'}
                                    </td>
                                    <td className="p-4 font-bold text-gray-800 dark:text-gray-100">₹{o.totalAmount}</td>
                                    <td className="p-4">
                                        <span className={`flex items-center gap-1 text-xs font-bold ${o.paymentMethod === 'ONLINE' ? 'text-purple-600 dark:text-purple-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {o.paymentMethod === 'ONLINE' ? <CreditCard className="w-3 h-3"/> : <Banknote className="w-3 h-3"/>}
                                            {o.paymentMethod || 'COD'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(o.status)}`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 transition inline-block" />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 font-bold text-right">
                Showing {filteredOrders.length} orders
            </div>
        </div>

        {/* --- ORDER DETAILS MODAL --- */}
        {selectedOrder && (
            <div className="fixed inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
                <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex justify-between items-center shrink-0">
                         <div>
                             <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                                 Order #{selectedOrder.id ? selectedOrder.id.slice(0,8) : 'N/A'}
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(selectedOrder.status)}`}>
                                     {selectedOrder.status}
                                 </span>
                             </h2>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                             </p>
                             {selectedOrder.status === 'DELIVERED' && (
                                 <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-2 font-medium">
                                    <CheckCircle className="w-3 h-3" /> Delivered
                                 </p>
                             )}
                         </div>
                         <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
                            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-gray-900">
                        
                        {/* Delivery Partner Section (If assigned) */}
                        {selectedOrder.deliveryPartner ? (
                            <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-xl p-4">
                                <h3 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase mb-3 flex items-center gap-2">
                                    <Bike className="w-4 h-4"/> Delivery Partner Assigned
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center overflow-hidden">
                                        {selectedOrder.deliveryPartner.imageUrl ? (
                                            <img src={selectedOrder.deliveryPartner.imageUrl} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <Bike className="w-6 h-6 text-teal-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-teal-100">{selectedOrder.deliveryPartner.name}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-teal-200/70 mt-1">
                                            <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {selectedOrder.deliveryPartner.phone}</span>
                                            <span className="flex items-center gap-1 uppercase bg-white dark:bg-teal-900/50 px-1.5 rounded border border-teal-100 dark:border-teal-900/30">{selectedOrder.deliveryPartner.vehicleNumber}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
                                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 flex items-center gap-3 text-orange-700 dark:text-orange-400">
                                    <Clock className="w-5 h-5" />
                                    <span className="text-sm font-bold">Waiting for delivery partner assignment...</span>
                                </div>
                            )
                        )}

                        {/* Customer & Address */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Customer Details</h3>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">
                                            {customer?.name || (selectedOrder.userId ? `User #${selectedOrder.userId.slice(0,6)}` : 'Guest User')}
                                        </p>
                                        <div className="space-y-1 mt-1">
                                            {customer?.phone && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3" /> {customer.phone}
                                                </p>
                                            )}
                                            {customer?.email && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                    <Mail className="w-3 h-3" /> {customer.email}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-start gap-1.5 mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                            <p className="leading-relaxed">{selectedOrder.deliveryAddress}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Restaurant</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                        <Store className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{selectedOrder.restaurantName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">ID: {selectedOrder.restaurantId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div>
                             <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Ordered Items</h3>
                             <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                 <table className="w-full text-left text-sm">
                                     <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-500">
                                         <tr>
                                             <th className="p-3 pl-4">Item</th>
                                             <th className="p-3 text-center">Qty</th>
                                             <th className="p-3 text-right pr-4">Price</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                         {(selectedOrder.items || []).map((item, idx) => (
                                             <tr key={idx}>
                                                 <td className="p-3 pl-4">
                                                     <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 border flex items-center justify-center rounded-sm shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800 dark:text-gray-200">{item.name}</p>
                                                            {item.selectedVariant && <p className="text-xs text-purple-600 dark:text-purple-400">{item.selectedVariant.name}</p>}
                                                        </div>
                                                     </div>
                                                 </td>
                                                 <td className="p-3 text-center text-gray-600 dark:text-gray-400">x{item.quantity}</td>
                                                 <td className="p-3 text-right pr-4 font-bold text-gray-800 dark:text-gray-200">₹{item.price * item.quantity}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    {selectedOrder.paymentMethod === 'ONLINE' ? <CreditCard className="w-5 h-5"/> : <Banknote className="w-5 h-5"/>}
                                    Payment Information
                                </h3>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${selectedOrder.paymentMethod === 'ONLINE' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                    {selectedOrder.paymentMethod === 'ONLINE' ? 'PAID ONLINE' : 'CASH ON DELIVERY'}
                                </span>
                            </div>
                            
                            {selectedOrder.paymentId && (
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                                    <span className="font-mono text-gray-800 dark:text-gray-200">{selectedOrder.paymentId}</span>
                                </div>
                            )}

                            <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-3"></div>

                            <div className="flex justify-between items-center">
                                <span className="font-black text-lg text-gray-800 dark:text-white">Total Amount</span>
                                <span className="font-black text-xl text-purple-600 dark:text-purple-400">₹{selectedOrder.totalAmount}</span>
                            </div>
                        </div>

                    </div>
                    
                    {/* Footer Actions */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 shrink-0">
                        <button 
                            onClick={() => setSelectedOrder(null)}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-xl transition"
                        >
                            Close Details
                        </button>
                    </div>

                </div>
            </div>
        )}
    </div>
  );
};