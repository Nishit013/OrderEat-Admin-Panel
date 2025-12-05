import React, { useEffect, useState } from 'react';
import { X, Package, Clock, CheckCircle, ChevronDown, ChevronUp, Star, RotateCcw, Ban, Bike, MapPin, Phone, CreditCard, Banknote } from 'lucide-react';
import { UserProfile, Order, OrderStatus } from '../types';
import { db } from '../firebase';

interface OrdersModalProps {
  user: UserProfile;
  onClose: () => void;
  onReorder: (order: Order) => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({ user, onClose, onReorder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Rating Modal State
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [restRating, setRestRating] = useState(0);
  const [delRating, setDelRating] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const ordersRef = db.ref('orders');
        ordersRef.on('value', (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.keys(data).map(key => ({ ...data[key], id: key })) as Order[];
            
            // Filter for current user and sort by date descending
            const userOrders = list
              .filter(order => order.userId === user.uid)
              .sort((a, b) => b.createdAt - a.createdAt);
              
            setOrders(userOrders);
          } else {
              setOrders([]);
          }
          setLoading(false);
        });
        
        return () => ordersRef.off();
      } catch (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
        await db.ref(`orders/${orderId}`).update({
            status: OrderStatus.CANCELLED
        });
        alert("Order cancelled successfully.");
    } catch (e) {
        console.error("Cancellation failed", e);
        alert("Failed to cancel order.");
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingOrderId) return;
    const order = orders.find(o => o.id === ratingOrderId);
    
    // Validate Ratings
    if (restRating === 0) {
        alert("Please rate the restaurant.");
        return;
    }
    
    // Only validate delivery rating if a delivery partner exists
    if (order?.deliveryPartner && delRating === 0) {
         alert("Please rate the delivery partner.");
         return;
    }

    try {
        const ratingsData: any = { restaurant: restRating };
        if (order?.deliveryPartner) ratingsData.delivery = delRating;

        await db.ref(`orders/${ratingOrderId}`).update({
            ratings: ratingsData
        });
        setRatingOrderId(null);
        setRestRating(0);
        setDelRating(0);
        // alert("Thank you for your feedback!");
    } catch (e) {
        console.error("Rating failed", e);
    }
  };

  const renderStars = (current: number, set: (n: number) => void, readOnly = false) => {
      return (
          <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    disabled={readOnly}
                    onClick={() => !readOnly && set(star)}
                    className={`transition-transform ${!readOnly ? 'hover:scale-110' : ''}`}
                  >
                      <Star 
                        className={`w-6 h-6 ${star <= current ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                      />
                  </button>
              ))}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white dark:bg-gray-900 w-full h-full sm:h-[90vh] sm:max-w-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight">Your Orders</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Track current orders or reorder favorites</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-950">
          {loading ? (
             <div className="flex justify-center p-20">
                 <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 text-gray-500 dark:text-gray-400">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-full shadow-sm mb-4">
                    <Package className="w-10 h-10 sm:w-12 sm:h-12 text-purple-200 dark:text-purple-900/50" />
                </div>
                <h3 className="font-bold text-gray-700 dark:text-gray-300 text-lg">No orders yet</h3>
                <p className="text-sm max-w-xs mx-auto text-gray-400 dark:text-gray-500 mt-1">Go ahead and order some delicious food!</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {orders.map(order => {
                const isExpanded = expandedOrderId === order.id;
                const canCancel = order.status === OrderStatus.PLACED || order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING;
                const isDelivered = order.status === OrderStatus.DELIVERED;
                
                return (
                  <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all">
                    
                    {/* Order Summary Header */}
                    <div className="p-4 sm:p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                                    <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg">{order.restaurantName}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span>{order.items.length} items</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>₹{order.totalAmount}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                                    </div>
                                    {order.paymentMethod && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-wide">
                                            {order.paymentMethod === 'ONLINE' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                                            {order.paymentMethod === 'ONLINE' ? 'Paid Online' : 'Cash on Delivery'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${
                                order.status === 'DELIVERED' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' :
                                order.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30' :
                                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                            }`}>
                                {order.status === 'DELIVERED' ? <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5"/> : 
                                 order.status === 'CANCELLED' ? <Ban className="w-3 h-3 sm:w-3.5 sm:h-3.5"/> :
                                 <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5"/>}
                                {order.status}
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex items-center gap-3 pt-2">
                             <button 
                                onClick={() => { onReorder(order); onClose(); }}
                                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg text-sm transition"
                             >
                                 <RotateCcw className="w-4 h-4" /> Reorder
                             </button>
                             
                             {canCancel && (
                                <button 
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold py-2 rounded-lg text-sm transition"
                                >
                                    <Ban className="w-4 h-4" /> Cancel
                                </button>
                             )}

                             {isDelivered && !order.ratings && (
                                 <button 
                                    onClick={() => setRatingOrderId(order.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 font-bold py-2 rounded-lg text-sm transition"
                                 >
                                    <Star className="w-4 h-4" /> Rate
                                 </button>
                             )}

                             <button 
                                onClick={() => toggleExpand(order.id)}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                             >
                                 {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                             </button>
                        </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                        <div className="bg-gray-50/50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800 p-4 sm:p-5 animate-in slide-in-from-top-2">
                             
                             {/* Items List */}
                             <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Items Ordered</h4>
                                <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <div className="flex items-start gap-2">
                                                <div className={`mt-1 w-3 h-3 border flex items-center justify-center rounded-sm shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-800 dark:text-gray-200 font-medium">
                                                        {item.name} {item.selectedVariant && <span className="text-xs text-gray-400">({item.selectedVariant.name})</span>}
                                                    </span>
                                                    <span className="text-xs text-gray-500">x{item.quantity}</span>
                                                </div>
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between font-bold text-gray-900 dark:text-white">
                                    <span>Total Amount Paid</span>
                                    <span>₹{order.totalAmount}</span>
                                </div>
                             </div>

                             {/* Delivery Partner Details - REMOVED per user request */}

                             {/* Address */}
                             <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                <MapPin className="w-4 h-4 mt-0.5 text-purple-600 shrink-0" />
                                <div>
                                    <span className="font-bold text-gray-800 dark:text-gray-200 block text-xs uppercase mb-1">Delivered To</span>
                                    {order.deliveryAddress}
                                </div>
                             </div>
                             
                             {/* User Ratings (If Rated) */}
                             {order.ratings && (
                                <div className="mt-6 flex gap-4">
                                    <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30 text-center">
                                        <p className="text-[10px] uppercase font-bold text-yellow-700 dark:text-yellow-500 mb-1">Restaurant Rating</p>
                                        <div className="flex justify-center gap-1 text-yellow-500">
                                            {Array.from({length: order.ratings.restaurant}).map((_, i) => <Star key={i} className="w-4 h-4 fill-current"/>)}
                                        </div>
                                    </div>
                                    {order.ratings.delivery && (
                                        <div className="flex-1 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center">
                                            <p className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-500 mb-1">Delivery Rating</p>
                                            <div className="flex justify-center gap-1 text-blue-500">
                                                {Array.from({length: order.ratings.delivery}).map((_, i) => <Star key={i} className="w-4 h-4 fill-current"/>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                             )}

                        </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Rating Modal Overlay */}
        {ratingOrderId && (
            <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="w-full max-w-sm text-center">
                    <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">Rate Your Order</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">How was your experience with {orders.find(o => o.id === ratingOrderId)?.restaurantName}?</p>
                    
                    <div className="mb-8 space-y-2">
                        <p className="font-bold text-gray-700 dark:text-gray-300">Restaurant Food</p>
                        <div className="flex justify-center">
                            {renderStars(restRating, setRestRating)}
                        </div>
                    </div>

                    {orders.find(o => o.id === ratingOrderId)?.deliveryPartner && (
                        <div className="mb-8 space-y-2">
                            <p className="font-bold text-gray-700 dark:text-gray-300">Delivery Partner</p>
                            <div className="flex justify-center">
                                {renderStars(delRating, setDelRating)}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setRatingOrderId(null)}
                            className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl"
                        >
                            Skip
                        </button>
                        <button 
                            onClick={handleSubmitRating}
                            className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/50"
                        >
                            Submit Review
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};