import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { DollarSign, ShoppingBag, Store, Users, Clock, Filter, TrendingUp, BarChart2 } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [rawData, setRawData] = useState<{orders: Order[], restaurants: any[], users: any[]}>({
      orders: [], restaurants: [], users: []
  });
  
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    restaurants: 0,
    users: 0,
    pendingRestaurants: 0
  });

  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('all');

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch All Data Once
      const [ordersSnap, restSnap, usersSnap] = await Promise.all([
          db.ref('orders').get(),
          db.ref('restaurants').get(),
          db.ref('users').get()
      ]);

      const orders = ordersSnap.exists() ? Object.values(ordersSnap.val()) as Order[] : [];
      const restaurants = restSnap.exists() ? Object.values(restSnap.val()) as any[] : [];
      const users = usersSnap.exists() ? Object.values(usersSnap.val()) as any[] : [];

      setRawData({ orders, restaurants, users });
    };
    fetchStats();
  }, []);

  // Recalculate stats when timeRange or data changes
  useEffect(() => {
      const now = new Date();
      const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
      const yesterdayStart = new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0,0,0,0);
      const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7)).getTime();
      const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).getTime();

      let filteredOrders = rawData.orders;
      let filteredUsers = rawData.users;

      if (timeRange === 'today') {
          filteredOrders = rawData.orders.filter(o => o.createdAt >= todayStart);
          filteredUsers = rawData.users.filter(u => u.createdAt >= todayStart);
      } else if (timeRange === 'yesterday') {
          filteredOrders = rawData.orders.filter(o => o.createdAt >= yesterdayStart && o.createdAt < todayStart);
          filteredUsers = rawData.users.filter(u => u.createdAt >= yesterdayStart && u.createdAt < todayStart);
      } else if (timeRange === '7days') {
          filteredOrders = rawData.orders.filter(o => o.createdAt >= sevenDaysAgo);
          filteredUsers = rawData.users.filter(u => u.createdAt >= sevenDaysAgo);
      } else if (timeRange === '30days') {
          filteredOrders = rawData.orders.filter(o => o.createdAt >= thirtyDaysAgo);
          filteredUsers = rawData.users.filter(u => u.createdAt >= thirtyDaysAgo);
      }

      // Calculate Stats based on filtered data
      const totalRev = filteredOrders
        .filter(o => o.status !== OrderStatus.CANCELLED)
        .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      
      const restCount = rawData.restaurants.filter(r => r.isApproved).length;
      const pendingCount = rawData.restaurants.filter(r => !r.isApproved).length;

      setStats({
        revenue: totalRev,
        orders: filteredOrders.length,
        restaurants: restCount, // Restaurants are usually total active, not filtered by time joined in this context
        users: filteredUsers.length, // Users joined in this period
        pendingRestaurants: pendingCount
      });

  }, [timeRange, rawData]);

  // Chart Data Processing
  const chartData = useMemo(() => {
    const dataMap: Record<string, { name: string; revenue: number; orders: number; timestamp: number }> = {};
    const now = new Date();
    const isHourly = timeRange === 'today' || timeRange === 'yesterday';

    // Initialize Buckets to ensure continuous line
    if (isHourly) {
        for(let i=0; i<24; i++) {
            const label = `${i}:00`;
            dataMap[label] = { name: label, revenue: 0, orders: 0, timestamp: i };
        }
    } else {
        const daysToCheck = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 14;
        for(let i=daysToCheck-1; i>=0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const label = `${d.getDate()}/${d.getMonth()+1}`;
            dataMap[label] = { name: label, revenue: 0, orders: 0, timestamp: d.getTime() };
        }
    }

    // Determine filter function same as stats
    const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
    const yesterdayStart = new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0,0,0,0);
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7)).getTime();
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).getTime();

    const filteredOrders = rawData.orders.filter(o => {
        if(o.status === OrderStatus.CANCELLED) return false;
        if (timeRange === 'today') return o.createdAt >= todayStart;
        if (timeRange === 'yesterday') return o.createdAt >= yesterdayStart && o.createdAt < todayStart;
        if (timeRange === '7days') return o.createdAt >= sevenDaysAgo;
        if (timeRange === '30days') return o.createdAt >= thirtyDaysAgo;
        return true;
    });

    filteredOrders.forEach(order => {
        const date = new Date(order.createdAt);
        let key = '';
        if (isHourly) {
            key = `${date.getHours()}:00`;
        } else {
            key = `${date.getDate()}/${date.getMonth()+1}`;
        }

        if (dataMap[key]) {
            dataMap[key].revenue += order.totalAmount;
            dataMap[key].orders += 1;
        } else if (timeRange === 'all') {
             // Dynamic keys for All Time
             key = `${date.getDate()}/${date.getMonth()+1}`;
             if(!dataMap[key]) dataMap[key] = { name: key, revenue: 0, orders: 0, timestamp: date.getTime() };
             dataMap[key].revenue += order.totalAmount;
             dataMap[key].orders += 1;
        }
    });

    return Object.values(dataMap).sort((a,b) => isHourly ? a.timestamp - b.timestamp : a.timestamp - b.timestamp);
  }, [rawData, timeRange]);

  const Card = ({ title, value, icon: Icon, color, subText, active }: any) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border transition-all ${active ? 'ring-2 ring-purple-500 border-transparent' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {timeRange !== 'all' && (
            <span className="flex items-center text-gray-400 text-xs font-bold bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-full">
            <Filter className="w-3 h-3 mr-1" /> {timeRange}
            </span>
        )}
      </div>
      <h3 className="text-3xl font-black text-gray-800 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      {subText && <p className="text-xs text-orange-500 font-bold mt-2 flex items-center gap-1"><Clock className="w-3 h-3"/> {subText}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h2>
        
        {/* Filter Controls */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl flex text-sm font-medium shadow-sm">
            {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' },
                { id: 'all', label: 'All Time' },
            ].map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => setTimeRange(opt.id as any)}
                    className={`px-4 py-2 rounded-lg transition-all ${timeRange === opt.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={DollarSign} color="bg-green-500 text-green-600" />
        <Card title="Orders" value={stats.orders} icon={ShoppingBag} color="bg-blue-500 text-blue-600" />
        <Card title="Active Restaurants" value={stats.restaurants} icon={Store} color="bg-purple-500 text-purple-600" subText={stats.pendingRestaurants > 0 ? `${stats.pendingRestaurants} Pending Approval` : ''} />
        <Card title="New Users" value={stats.users} icon={Users} color="bg-orange-500 text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[350px] flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" /> Revenue Growth
                    </h3>
                    <p className="text-xs text-gray-400">Total revenue over selected period</p>
                </div>
             </div>
             
             <div className="flex-1 w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#9CA3AF'}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#9CA3AF'}} 
                            tickFormatter={(val) => `₹${val}`}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`₹${value}`, 'Revenue']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#9333ea" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>

        {/* Order Volume Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[350px] flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-blue-600" /> Order Volume
                    </h3>
                    <p className="text-xs text-gray-400">Number of orders placed</p>
                </div>
             </div>
             <div className="flex-1 w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#9CA3AF'}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#9CA3AF'}} 
                            allowDecimals={false}
                        />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar 
                            dataKey="orders" 
                            fill="#3b82f6" 
                            radius={[6, 6, 0, 0]} 
                            barSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>
    </div>
  );
};