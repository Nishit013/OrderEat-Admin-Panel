import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { DollarSign, ShoppingBag, Users, Store, Bike, TrendingUp, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '../../types';

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todaysRevenue: 0,
    totalOrders: 0,
    activeRestaurants: 0,
    pendingRestaurants: 0,
    totalUsers: 0,
    activePartners: 0
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        const ordersRef = db.ref('orders');
        const usersRef = db.ref('users');
        const restRef = db.ref('restaurants');
        const partnerRef = db.ref('deliveryPartners');

        const [ordersSnap, usersSnap, restSnap, partnerSnap] = await Promise.all([
            ordersRef.get(),
            usersRef.get(),
            restRef.get(),
            partnerRef.get()
        ]);

        let revenue = 0;
        let todayRev = 0;
        let ordersCount = 0;
        let recent: Order[] = [];

        if (ordersSnap.exists()) {
            const data = ordersSnap.val();
            const ordersList = Object.values(data) as Order[];
            ordersCount = ordersList.length;
            
            // Calculate Revenue (only from non-cancelled)
            const validOrders = ordersList.filter(o => o.status !== OrderStatus.CANCELLED);
            revenue = validOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
            
            // Today's Revenue
            const today = new Date().setHours(0,0,0,0);
            todayRev = validOrders.filter(o => o.createdAt >= today).reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

            // Recent Orders
            recent = ordersList.sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
        }

        let restCount = 0;
        let pendingRest = 0;
        if (restSnap.exists()) {
             const data = restSnap.val();
             const list = Object.values(data) as any[];
             restCount = list.filter((r) => r.isApproved).length;
             pendingRest = list.filter((r) => !r.isApproved).length;
        }

        let userCount = 0;
        if (usersSnap.exists()) userCount = Object.keys(usersSnap.val()).length;

        let partnerCount = 0;
        if (partnerSnap.exists()) {
            const data = partnerSnap.val();
            partnerCount = Object.values(data).filter((p: any) => p.isApproved).length;
        }

        setStats({
            totalRevenue: revenue,
            todaysRevenue: todayRev,
            totalOrders: ordersCount,
            activeRestaurants: restCount,
            pendingRestaurants: pendingRest,
            totalUsers: userCount,
            activePartners: partnerCount
        });
        setRecentOrders(recent);
    };

    fetchData();
  }, []);

  const Card = ({ title, value, subValue, icon: Icon, color, lightColor }: any) => (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start justify-between hover:shadow-md transition">
          <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
              <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100">{value}</h3>
              {subValue && <p className="text-xs font-medium text-gray-400 mt-1">{subValue}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lightColor}`}>
              <Icon className={`w-6 h-6 ${color}`} />
          </div>
      </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>
                <p className="text-gray-500 dark:text-gray-400">Real-time overview of your platform</p>
            </div>
            {stats.pendingRestaurants > 0 && (
                <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4" /> {stats.pendingRestaurants} Pending Approvals
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
                title="Total Revenue" 
                value={`₹${stats.totalRevenue.toLocaleString()}`} 
                subValue={`+₹${stats.todaysRevenue.toLocaleString()} today`}
                icon={DollarSign} 
                color="text-green-600" 
                lightColor="bg-green-100 dark:bg-green-900/30" 
            />
            <Card 
                title="Total Orders" 
                value={stats.totalOrders} 
                icon={ShoppingBag} 
                color="text-blue-600" 
                lightColor="bg-blue-100 dark:bg-blue-900/30" 
            />
            <Card 
                title="Active Restaurants" 
                value={stats.activeRestaurants} 
                subValue={`${stats.pendingRestaurants} pending`}
                icon={Store} 
                color="text-purple-600" 
                lightColor="bg-purple-100 dark:bg-purple-900/30" 
            />
            <Card 
                title="Delivery Fleet" 
                value={stats.activePartners} 
                icon={Bike} 
                color="text-orange-600" 
                lightColor="bg-orange-100 dark:bg-orange-900/30" 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Chart Placeholder */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" /> Revenue Analytics
                    </h3>
                    <select className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs p-2">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                    </select>
                </div>
                <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium">Revenue Growth Chart Visualization</p>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                 <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Orders</h3>
                 <div className="space-y-4">
                     {recentOrders.map(order => (
                         <div key={order.id} className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                             <div>
                                 <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate w-32">{order.restaurantName}</p>
                                 <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                             </div>
                             <div className="text-right">
                                 <p className="font-bold text-purple-600 dark:text-purple-400 text-sm">₹{order.totalAmount}</p>
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                     order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                     order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                 }`}>
                                     {order.status}
                                 </span>
                             </div>
                         </div>
                     ))}
                     {recentOrders.length === 0 && <p className="text-sm text-gray-400 text-center">No recent orders</p>}
                 </div>
            </div>
        </div>
    </div>
  );
};