
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Order, OrderStatus, Restaurant, AdminSettings, PayoutLog, DeliveryPartner } from '../types';
import { DollarSign, Percent, TrendingUp, Download, Bike, Wallet, CreditCard, Banknote, X, Landmark, Copy, Check, History, CheckCircle2 } from 'lucide-react';

interface FinancialMetrics {
  totalIncludingGST: number; // GMV
  totalExcludingGST: number; // Base Food Value
  totalGST: number;
  totalCommission: number;
  totalDeliveryFees: number;
  totalRestaurantPayable: number; // Final Payout to Restaurant
  totalCashRevenue: number;
  totalOnlineRevenue: number;
  totalPartnerPayouts: number; // Calculated Partner Payouts
}

interface RestaurantAnalytics extends FinancialMetrics {
  id: string;
  name: string;
  orderCount: number;
}

interface PartnerAnalytics {
    id: string;
    name: string;
    deliveriesCount: number;
    totalFees: number;
}

export const Analytics: React.FC = () => {
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('all');
  
  // Data States
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [payouts, setPayouts] = useState<PayoutLog[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({ taxRate: 5, platformCommission: 20, deliveryBaseFee: 40, deliveryPerKm: 10 });
  
  // Metrics States
  const [globalMetrics, setGlobalMetrics] = useState<FinancialMetrics>({
    totalIncludingGST: 0,
    totalExcludingGST: 0,
    totalGST: 0,
    totalCommission: 0,
    totalDeliveryFees: 0,
    totalRestaurantPayable: 0,
    totalCashRevenue: 0,
    totalOnlineRevenue: 0,
    totalPartnerPayouts: 0
  });
  const [restaurantBreakdown, setRestaurantBreakdown] = useState<RestaurantAnalytics[]>([]);
  const [partnerBreakdown, setPartnerBreakdown] = useState<PartnerAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedFinancialRest, setSelectedFinancialRest] = useState<RestaurantAnalytics | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 1. Real-time Listeners
  useEffect(() => {
    setLoading(true);
    const ordersRef = db.ref('orders');
    const restRef = db.ref('restaurants');
    const partnerRef = db.ref('deliveryPartners');
    const settingsRef = db.ref('adminSettings');
    const payoutsRef = db.ref('payouts');

    const handleOrders = (snap: any) => {
        if (snap.exists()) setRawOrders(Object.values(snap.val()) as Order[]);
        else setRawOrders([]);
    };

    const handleRestaurants = (snap: any) => {
        if (snap.exists()) {
             const list = Object.keys(snap.val()).map(k => ({...snap.val()[k], id: k}));
             setRestaurants(list);
        }
        else setRestaurants([]);
    };

    const handlePartners = (snap: any) => {
        if (snap.exists()) {
            const list = Object.keys(snap.val()).map(k => ({...snap.val()[k], id: k}));
            setPartners(list);
        } else setPartners([]);
    };

    const handleSettings = (snap: any) => {
        if (snap.exists()) setSettings(snap.val());
    };

    const handlePayouts = (snap: any) => {
        if (snap.exists()) setPayouts(Object.values(snap.val()) as PayoutLog[]);
        else setPayouts([]);
    };

    ordersRef.on('value', handleOrders);
    restRef.on('value', handleRestaurants);
    partnerRef.on('value', handlePartners);
    settingsRef.on('value', handleSettings);
    payoutsRef.on('value', handlePayouts);

    return () => {
        ordersRef.off();
        restRef.off();
        partnerRef.off();
        settingsRef.off();
        payoutsRef.off();
    };
  }, []);

  // 2. Calculation Logic
  useEffect(() => {
    calculateMetrics();
  }, [rawOrders, restaurants, settings, dateFilter]);

  const calculateMetrics = () => {
    // A. Filter Orders
    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
    const yesterdayStart = new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0,0,0,0);
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7)).getTime();
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).getTime();

    const filteredOrders = rawOrders.filter(o => {
        if (o.status === OrderStatus.CANCELLED) return false;
        
        if (dateFilter === 'today') return o.createdAt >= todayStart;
        if (dateFilter === 'yesterday') return o.createdAt >= yesterdayStart && o.createdAt < todayStart;
        if (dateFilter === '7days') return o.createdAt >= sevenDaysAgo;
        if (dateFilter === '30days') return o.createdAt >= thirtyDaysAgo;
        return true;
    });

    // B. Initialize Maps
    const breakdownMap: Record<string, RestaurantAnalytics> = {};
    const partnerMap: Record<string, PartnerAnalytics> = {};
    
    restaurants.forEach((r: any) => {
        breakdownMap[r.id] = {
            id: r.id,
            name: r.name,
            orderCount: 0,
            totalIncludingGST: 0,
            totalExcludingGST: 0,
            totalGST: 0,
            totalCommission: 0,
            totalDeliveryFees: 0,
            totalRestaurantPayable: 0,
            totalCashRevenue: 0,
            totalOnlineRevenue: 0,
            totalPartnerPayouts: 0
        };
    });

    // C. Process each order
    let gTotal = 0;
    let gExcl = 0;
    let gTax = 0;
    let gComm = 0;
    let gDel = 0;
    let gPayable = 0;
    let gCash = 0;
    let gOnline = 0;
    let gPartnerPayouts = 0;

    filteredOrders.forEach(order => {
        const restId = order.restaurantId;
        const rest = restaurants.find(r => r.id === restId);
        
        // 1. Determine Settings
        const taxRate = rest?.customTaxRate ?? settings.taxRate ?? 5;
        const commRate = rest?.commissionRate ?? settings.platformCommission ?? 20;
        const deliveryFee = rest?.customDeliveryFee ?? settings.deliveryBaseFee ?? 40;

        const totalAmount = order.totalAmount || 0; // Gross Revenue

        // Payment Method Split
        if (order.paymentMethod === 'ONLINE') {
            gOnline += totalAmount;
        } else {
            gCash += totalAmount;
        }
        
        // 2. Math Logic
        // Formula: Food + GST = Total - Delivery
        const foodPortionWithTax = Math.max(0, totalAmount - deliveryFee);
        
        // Base Food Value = (Food+GST) / (1 + Tax%)
        const baseAmount = foodPortionWithTax / (1 + (taxRate / 100));
        
        const taxAmount = foodPortionWithTax - baseAmount;
        
        // Commission is charged on Net Sales (Base Food Value)
        const commission = baseAmount * (commRate / 100);

        // Payable Amount = Gross - Delivery - GST - Commission
        // Which mathematically equals: BaseAmount - Commission
        const restaurantPayable = baseAmount - commission;

        // Accumulate Global
        gTotal += totalAmount;
        gExcl += baseAmount;
        gTax += taxAmount;
        gComm += commission;
        gDel += deliveryFee;
        gPayable += restaurantPayable;

        // Accumulate Restaurant Specific
        if (!breakdownMap[restId]) {
             breakdownMap[restId] = {
                id: restId,
                name: order.restaurantName || 'Unknown',
                orderCount: 0,
                totalIncludingGST: 0,
                totalExcludingGST: 0,
                totalGST: 0,
                totalCommission: 0,
                totalDeliveryFees: 0,
                totalRestaurantPayable: 0,
                totalCashRevenue: 0,
                totalOnlineRevenue: 0,
                totalPartnerPayouts: 0
            };
        }
        
        breakdownMap[restId].orderCount += 1;
        breakdownMap[restId].totalIncludingGST += totalAmount;
        breakdownMap[restId].totalExcludingGST += baseAmount;
        breakdownMap[restId].totalGST += taxAmount;
        breakdownMap[restId].totalCommission += commission;
        breakdownMap[restId].totalDeliveryFees += deliveryFee;
        breakdownMap[restId].totalRestaurantPayable += restaurantPayable;

        // Accumulate Partner Specific (Only Delivered Orders)
        if (order.status === OrderStatus.DELIVERED) {
            // Use specific partnerPayout if available, else fallback to generic delivery fee (for legacy data)
            const feeGenerated = order.partnerPayout ?? deliveryFee;
            gPartnerPayouts += feeGenerated;

            if (order.deliveryPartner) {
                const pId = order.deliveryPartner.id;
                const pName = order.deliveryPartner.name;
                
                if (!partnerMap[pId]) {
                    partnerMap[pId] = { id: pId, name: pName, deliveriesCount: 0, totalFees: 0 };
                }
                partnerMap[pId].deliveriesCount += 1;
                partnerMap[pId].totalFees += feeGenerated;
            }
        }
    });

    setGlobalMetrics({
        totalIncludingGST: gTotal,
        totalExcludingGST: gExcl,
        totalGST: gTax,
        totalCommission: gComm,
        totalDeliveryFees: gDel,
        totalRestaurantPayable: gPayable,
        totalCashRevenue: gCash,
        totalOnlineRevenue: gOnline,
        totalPartnerPayouts: gPartnerPayouts
    });

    setRestaurantBreakdown(Object.values(breakdownMap).filter(r => r.orderCount > 0));
    setPartnerBreakdown(Object.values(partnerMap));
    setLoading(false);
  };

  const getRestaurantDetails = (id: string) => restaurants.find(r => r.id === id);
  const getPartnerDetails = (id: string) => partners.find(p => p.id === id);

  // --- LEDGER HELPERS ---

  // Calculate LIFETIME Partner Financials (Ignored Dashboard Date Filter)
  const getPartnerFinancials = (partnerId: string) => {
      // 1. Total Lifetime Earnings (From all orders ever delivered by this partner)
      const lifetimeFees = rawOrders
        .filter(o => o.deliveryPartner?.id === partnerId && o.status === OrderStatus.DELIVERED)
        .reduce((acc, order) => {
             // Use stored partnerPayout for accuracy
             if (order.partnerPayout !== undefined) {
                 return acc + order.partnerPayout;
             }
             // Fallback for old orders
             const rest = restaurants.find(r => r.id === order.restaurantId);
             const fee = rest?.customDeliveryFee ?? settings.deliveryBaseFee ?? 40;
             return acc + fee;
        }, 0);
      
      const lifetimeRuns = rawOrders.filter(o => o.deliveryPartner?.id === partnerId && o.status === OrderStatus.DELIVERED).length;

      // 2. Total Settled
      const partnerPayouts = payouts.filter(p => p.partnerId === partnerId);
      const totalSettled = partnerPayouts.reduce((acc, p) => acc + p.amount, 0);

      // 3. Payable
      const payable = lifetimeFees - totalSettled;

      return { lifetimeFees, lifetimeRuns, totalSettled, payable, partnerPayouts };
  };

  // Calculate LIFETIME Restaurant Ledger
  const getRestaurantLedger = (restId: string) => {
      // 1. Filter ALL valid orders for this restaurant (ignore date filter)
      const lifetimeOrders = rawOrders.filter(o => o.restaurantId === restId && o.status !== OrderStatus.CANCELLED);
      
      let lifetimePayable = 0;

      lifetimeOrders.forEach(order => {
           const rest = restaurants.find(r => r.id === restId);
           const taxRate = rest?.customTaxRate ?? settings.taxRate ?? 5;
           const commRate = rest?.commissionRate ?? settings.platformCommission ?? 20;
           const deliveryFee = rest?.customDeliveryFee ?? settings.deliveryBaseFee ?? 40;

           const totalAmount = order.totalAmount || 0;
           const foodPortionWithTax = Math.max(0, totalAmount - deliveryFee);
           const baseAmount = foodPortionWithTax / (1 + (taxRate / 100));
           const commission = baseAmount * (commRate / 100);
           
           lifetimePayable += (baseAmount - commission);
      });

      // 2. Total Settled
      const restPayouts = payouts.filter(p => p.restaurantId === restId);
      const totalSettled = restPayouts.reduce((acc, p) => acc + p.amount, 0);

      // 3. Outstanding Balance
      const outstanding = lifetimePayable - totalSettled;

      return { lifetimePayable, totalSettled, outstanding, restPayouts };
  };

  const handleSettlePartner = async (partnerId: string, amount: number) => {
      if (amount <= 0) return;
      if (!window.confirm(`Confirm settlement of ₹${amount.toFixed(0)}?`)) return;

      const payout: PayoutLog = {
          id: Date.now().toString(),
          partnerId,
          amount,
          timestamp: Date.now(),
          status: 'SUCCESS'
      };

      try {
          await db.ref('payouts').push(payout);
          alert("Settlement recorded successfully!");
      } catch (e) {
          console.error("Settlement failed", e);
          alert("Failed to record settlement");
      }
  };

  const handleSettleRestaurant = async (restaurantId: string, amount: number) => {
      if (amount <= 0) return;
      if (!window.confirm(`Confirm settlement of ₹${amount.toFixed(0)} for this restaurant?`)) return;

      const payout: PayoutLog = {
          id: Date.now().toString(),
          restaurantId,
          amount,
          timestamp: Date.now(),
          status: 'SUCCESS'
      };

      try {
          await db.ref('payouts').push(payout);
          alert("Restaurant settlement recorded successfully!");
      } catch (e) {
          console.error("Settlement failed", e);
          alert("Failed to record settlement");
      }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const StatCard = ({ title, value, sub, color, icon: Icon }: any) => (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
              <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-1">₹{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
              </div>
              <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                  <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
              </div>
          </div>
          {sub && <p className="text-xs text-gray-400 font-medium">{sub}</p>}
      </div>
  );

  // Ledger Data Objects
  const selectedPartnerData = selectedPartnerId ? getPartnerFinancials(selectedPartnerId) : null;
  const selectedPartnerProfile = selectedPartnerId ? getPartnerDetails(selectedPartnerId) : null;

  const selectedRestLedger = selectedFinancialRest ? getRestaurantLedger(selectedFinancialRest.id) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Financial Analytics <TrendingUp className="w-6 h-6 text-purple-600"/>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Detailed revenue breakdown including Taxes, Commissions & Delivery Fees</p>
            </div>
            
            <div className="flex items-center gap-3">
                 <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl flex text-sm font-medium shadow-sm">
                    {[
                        { id: 'today', label: 'Today' },
                        { id: '7days', label: '7 Days' },
                        { id: '30days', label: '30 Days' },
                        { id: 'all', label: 'All Time' },
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setDateFilter(opt.id as any)}
                            className={`px-3 py-1.5 rounded-lg transition-all text-xs ${dateFilter === opt.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <button className="p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl shadow-lg hover:opacity-90 transition" title="Export CSV">
                    <Download className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Global Summary Cards - 2 Rows of 2 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard 
                title="Gross Revenue" 
                value={globalMetrics.totalIncludingGST} 
                sub="Total Paid by Customers"
                color="bg-blue-500 text-blue-600"
                icon={DollarSign}
            />
            <StatCard 
                title="Platform Earnings" 
                value={globalMetrics.totalCommission} 
                sub="Commission from Sales"
                color="bg-purple-500 text-purple-600"
                icon={Wallet}
            />
            <StatCard 
                title="Restaurant Payable" 
                value={globalMetrics.totalRestaurantPayable} 
                sub="Net Payout to Partners"
                color="bg-green-600 text-green-600"
                icon={TrendingUp}
            />
             <StatCard 
                title="GST Collected" 
                value={globalMetrics.totalGST} 
                sub="Payable to Govt"
                color="bg-orange-500 text-orange-600"
                icon={Percent}
            />
        </div>

        {/* Secondary Metrics - 1 Row of 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard 
                title="Online Revenue" 
                value={globalMetrics.totalOnlineRevenue} 
                sub="Paid Online"
                color="bg-indigo-500 text-indigo-600"
                icon={CreditCard}
            />
             <StatCard 
                title="Cash Revenue" 
                value={globalMetrics.totalCashRevenue} 
                sub="Collected via COD/UPI"
                color="bg-emerald-500 text-emerald-600"
                icon={Banknote}
            />
            <StatCard 
                title="Partner Payouts" 
                value={globalMetrics.totalPartnerPayouts} 
                sub="Payable to Fleet"
                color="bg-red-500 text-red-600"
                icon={Bike}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Restaurant Performance */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white">Restaurant Financials</h3>
                    <span className="text-xs font-bold text-gray-500 uppercase">Settlement Breakdown</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">Restaurant</th>
                                <th className="p-4 text-center">Orders</th>
                                <th className="p-4 text-right">Net Sales</th>
                                <th className="p-4 text-right text-orange-600">GST</th>
                                <th className="p-4 text-right text-purple-600">Comm.</th>
                                <th className="p-4 text-right text-green-600">Payable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Crunching numbers...</td></tr>
                            ) : restaurantBreakdown.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No data for selected period.</td></tr>
                            ) : (
                                restaurantBreakdown
                                    .sort((a,b) => b.totalRestaurantPayable - a.totalRestaurantPayable)
                                    .map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td 
                                            onClick={() => setSelectedFinancialRest(r)}
                                            className="p-4 font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                            title="View Payment Details"
                                        >
                                            {r.name}
                                        </td>
                                        <td className="p-4 text-center text-gray-500">{r.orderCount}</td>
                                        <td className="p-4 text-right font-medium text-gray-600 dark:text-gray-400" title="Base Food Value">₹{r.totalExcludingGST.toFixed(0)}</td>
                                        <td className="p-4 text-right font-bold text-orange-600 dark:text-orange-400">₹{r.totalGST.toFixed(0)}</td>
                                        <td className="p-4 text-right font-bold text-purple-600 dark:text-purple-400">₹{r.totalCommission.toFixed(0)}</td>
                                        <td className="p-4 text-right font-black text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/10">₹{r.totalRestaurantPayable.toFixed(0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delivery Partner Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                     <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Bike className="w-5 h-5 text-teal-600" /> Delivery Fleet
                     </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">Partner</th>
                                <th className="p-4 text-center">Runs</th>
                                <th className="p-4 text-right">Fee Earned</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {partnerBreakdown.length === 0 ? (
                                <tr><td colSpan={3} className="p-8 text-center text-gray-400">No active partner data.</td></tr>
                            ) : (
                                partnerBreakdown.sort((a,b) => b.totalFees - a.totalFees).map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td 
                                            onClick={() => setSelectedPartnerId(p.id)}
                                            className="p-4 font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                        >
                                            {p.name}
                                        </td>
                                        <td className="p-4 text-center text-gray-500">{p.deliveriesCount}</td>
                                        <td className="p-4 text-right font-bold text-teal-600 dark:text-teal-400">₹{p.totalFees.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                         </tbody>
                         <tfoot className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 font-bold text-xs">
                             <tr>
                                 <td className="p-4 text-gray-500 uppercase">Total</td>
                                 <td className="p-4 text-center">{partnerBreakdown.reduce((acc, p) => acc + p.deliveriesCount, 0)}</td>
                                 <td className="p-4 text-right text-teal-600 dark:text-teal-400">₹{partnerBreakdown.reduce((acc, p) => acc + p.totalFees, 0).toLocaleString()}</td>
                             </tr>
                         </tfoot>
                    </table>
                </div>
            </div>
        </div>

        {/* --- RESTAURANT FINANCIAL MODAL --- */}
        {selectedFinancialRest && selectedRestLedger && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                         <div>
                             <h3 className="text-xl font-bold text-gray-800 dark:text-white">Payout Management</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{selectedFinancialRest.name}</p>
                         </div>
                         <button 
                            onClick={() => setSelectedFinancialRest(null)}
                            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {/* Ledger Balance Card */}
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center mb-6">
                            <p className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">Outstanding Ledger Balance</p>
                            <h2 className="text-4xl font-black text-green-600 dark:text-green-400">
                                ₹{selectedRestLedger.outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Total Lifetime Earnings (₹{selectedRestLedger.lifetimePayable.toFixed(0)}) - Total Settled (₹{selectedRestLedger.totalSettled.toFixed(0)})
                            </p>
                        </div>

                        {/* Period Stats (From Table) */}
                        <div className="space-y-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-6">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Selected Period Earnings</h4>
                            <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 pb-3">
                                <span className="text-gray-500 dark:text-gray-400">Net Sales (Excl Tax)</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">₹{selectedFinancialRest.totalExcludingGST.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 pb-3">
                                <span className="text-gray-500 dark:text-gray-400">Platform Commission</span>
                                <span className="font-bold text-red-500">- ₹{selectedFinancialRest.totalCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pb-3">
                                <span className="text-gray-500 dark:text-gray-400">GST Collected</span>
                                <span className="font-bold text-orange-500">₹{selectedFinancialRest.totalGST.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>

                        {/* UPI / Banking */}
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                                <Landmark className="w-4 h-4" /> Banking Details
                            </h4>
                            {getRestaurantDetails(selectedFinancialRest.id)?.upiId ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">UPI ID</p>
                                        <p className="font-mono font-bold text-gray-800 dark:text-white">
                                            {getRestaurantDetails(selectedFinancialRest.id)?.upiId}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => copyToClipboard(getRestaurantDetails(selectedFinancialRest.id)?.upiId || '')}
                                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition"
                                    >
                                        {copied ? <Check className="w-5 h-5"/> : <Copy className="w-5 h-5"/>}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-2 text-gray-400 text-sm italic">
                                    No UPI ID configured.
                                </div>
                            )}
                        </div>

                        {/* Settle Button */}
                        {selectedRestLedger.outstanding > 0 && (
                            <button 
                                onClick={() => handleSettleRestaurant(selectedFinancialRest.id, selectedRestLedger.outstanding)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 dark:shadow-green-900/30 mb-8 transition active:scale-[0.98] flex justify-center items-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Settle Full Amount (₹{selectedRestLedger.outstanding.toFixed(0)})
                            </button>
                        )}

                        {/* Settlement History */}
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-sm">
                                <History className="w-4 h-4 text-gray-400" /> Settlement History
                            </h4>
                            <div className="space-y-3">
                                {selectedRestLedger.restPayouts.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-xl">No past settlements found.</p>
                                ) : (
                                    selectedRestLedger.restPayouts.sort((a,b) => b.timestamp - a.timestamp).map(log => (
                                        <div key={log.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">Settlement Processed</p>
                                                <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                                            </div>
                                            <span className="font-mono font-bold text-green-600 dark:text-green-400">-₹{log.amount.toFixed(0)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        )}

        {/* --- PARTNER SETTLEMENT MODAL --- */}
        {selectedPartnerId && selectedPartnerData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                     
                     {/* Header */}
                     <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 flex justify-between items-start">
                         <div>
                             <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedPartnerData.payable >= 0 ? 'Settlement Due' : 'Account Overview'}</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPartnerProfile?.name || 'Partner'}</p>
                         </div>
                         <button onClick={() => setSelectedPartnerId(null)} className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-full transition">
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                     </div>

                     <div className="p-6 overflow-y-auto">
                        
                        {/* Summary Card */}
                        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-6 text-center mb-6">
                            <p className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-2">Current Payable Balance</p>
                            <h2 className="text-4xl font-black text-teal-700 dark:text-teal-400">
                                ₹{selectedPartnerData.payable.toLocaleString()}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Lifetime Earnings (₹{selectedPartnerData.lifetimeFees.toLocaleString()}) - Total Settled (₹{selectedPartnerData.totalSettled.toLocaleString()})
                            </p>
                        </div>

                        {/* UPI Details */}
                        <div className="mb-6">
                             <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex justify-between items-center">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                         <Landmark className="w-5 h-5 text-gray-500" />
                                     </div>
                                     <div>
                                         <p className="text-xs text-gray-400 uppercase font-bold">Banking UPI</p>
                                         <p className="font-mono font-bold text-gray-800 dark:text-white text-sm">
                                             {selectedPartnerProfile?.upiId || 'Not Configured'}
                                         </p>
                                     </div>
                                 </div>
                                 {selectedPartnerProfile?.upiId && (
                                     <button 
                                        onClick={() => copyToClipboard(selectedPartnerProfile.upiId!)}
                                        className="text-teal-600 hover:text-teal-700 font-bold text-xs bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1"
                                     >
                                        {copied ? 'Copied' : 'Copy'}
                                     </button>
                                 )}
                             </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                                <p className="text-xs text-gray-400 uppercase font-bold">Total Runs</p>
                                <p className="text-xl font-black text-gray-800 dark:text-white">{selectedPartnerData.lifetimeRuns}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
                                <p className="text-xs text-gray-400 uppercase font-bold">Total Settled</p>
                                <p className="text-xl font-black text-gray-800 dark:text-white">₹{selectedPartnerData.totalSettled.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Settle Button */}
                        {selectedPartnerData.payable > 0 && (
                            <button 
                                onClick={() => handleSettlePartner(selectedPartnerId!, selectedPartnerData.payable)}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-200 dark:shadow-teal-900/30 mb-8 transition active:scale-[0.98] flex justify-center items-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Settle Full Amount (₹{selectedPartnerData.payable})
                            </button>
                        )}

                        {/* Settlement History */}
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-sm">
                                <History className="w-4 h-4 text-gray-400" /> Recent Settlements
                            </h4>
                            <div className="space-y-3">
                                {selectedPartnerData.partnerPayouts.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-xl">No past settlements found.</p>
                                ) : (
                                    selectedPartnerData.partnerPayouts.sort((a,b) => b.timestamp - a.timestamp).map(log => (
                                        <div key={log.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">Settlement Processed</p>
                                                <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                                            </div>
                                            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">-₹{log.amount.toFixed(0)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                     </div>
                </div>
            </div>
        )}
    </div>
  );
};
