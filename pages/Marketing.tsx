
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { Coupon, InspirationItem, GlobalOffer, Restaurant, MenuItem } from '../types';
import { Trash2, Megaphone, Image, Sparkles, LayoutTemplate, Tag, Plus, Store, UtensilsCrossed } from 'lucide-react';

export const Marketing: React.FC = () => {
  // Extending Coupon type locally to include the Firebase key
  const [coupons, setCoupons] = useState<(Coupon & { key: string })[]>([]);
  const [inspiration, setInspiration] = useState<InspirationItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  
  // Modern Banner Default State
  const [globalOffer, setGlobalOffer] = useState<GlobalOffer>({ 
      isActive: false, 
      text: '', 
      subText: '',
      gradientStart: '#9333ea', // Purple-600
      gradientEnd: '#2563eb',   // Blue-600
      actionText: 'Order Now',
      textColor: '#ffffff'
  });
  
  // Forms
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ 
      discountType: 'FLAT',
      validForFirstOrder: false,
      maxDiscount: 0,
      value: 0,
      minOrder: 0,
      code: '',
      description: '',
      restaurantId: '',
      category: ''
  });
  const [newInsp, setNewInsp] = useState({ name: '', image: '' });

  useEffect(() => {
    // Listeners
    const couponsRef = db.ref('coupons');
    const inspirationRef = db.ref('inspiration');
    const globalRef = db.ref('globalOffer');
    const restRef = db.ref('restaurants');

    couponsRef.on('value', s => {
        if(s.exists()) {
            const data = s.val();
            const list = Object.keys(data).map(k => ({...data[k], key: k}));
            setCoupons(list);
        } else {
            setCoupons([]);
        }
    });

    inspirationRef.on('value', s => s.exists() ? setInspiration(Object.keys(s.val()).map(k => ({...s.val()[k], id: k}))) : setInspiration([]));
    globalRef.on('value', s => s.exists() && setGlobalOffer(s.val()));
    
    restRef.on('value', s => {
        if (s.exists()) {
            const list = Object.keys(s.val()).map(k => ({...s.val()[k], id: k}));
            setRestaurants(list);
        }
    });

    return () => { 
        couponsRef.off(); 
        inspirationRef.off(); 
        globalRef.off(); 
        restRef.off();
    }
  }, []);

  // Derive unique categories from selected restaurant (or all if none selected)
  const availableCategories = useMemo(() => {
      const cats = new Set<string>();
      
      const targetRestaurants = newCoupon.restaurantId 
          ? restaurants.filter(r => r.id === newCoupon.restaurantId)
          : restaurants;

      targetRestaurants.forEach(r => {
          if (r.menu) {
              Object.values(r.menu).forEach((item: any) => {
                  if (item.category) cats.add(item.category);
              });
          }
      });
      return Array.from(cats).sort();
  }, [restaurants, newCoupon.restaurantId]);

  const addCoupon = async () => {
      if(!newCoupon.code) {
          alert("Coupon code is required");
          return;
      }
      
      // Sanitization: Ensure no undefined or NaN values are sent to Firebase
      // Use logic to omit keys if they are empty strings or undefined
      const couponPayload: any = {
          id: Date.now().toString(),
          code: (newCoupon.code || '').toUpperCase(),
          description: newCoupon.description || '',
          discountType: newCoupon.discountType || 'FLAT',
          value: Number(newCoupon.value) || 0,
          minOrder: Number(newCoupon.minOrder) || 0,
          maxDiscount: Number(newCoupon.maxDiscount) || 0,
          validForFirstOrder: !!newCoupon.validForFirstOrder,
      };

      // Only add optional fields if they have truthy values (non-empty strings)
      if (newCoupon.restaurantId) {
          couponPayload.restaurantId = newCoupon.restaurantId;
      }
      if (newCoupon.category) {
          couponPayload.category = newCoupon.category;
      }

      try {
        await db.ref('coupons').push(couponPayload);
        setNewCoupon({ 
            discountType: 'FLAT', 
            code: '', 
            description: '', 
            value: 0, 
            minOrder: 0, 
            maxDiscount: 0, 
            validForFirstOrder: false,
            restaurantId: '',
            category: ''
        });
      } catch (e) {
          console.error("Failed to add coupon", e);
          alert("Failed to create coupon. Please check inputs.");
      }
  };

  const deleteCoupon = async (key: string) => {
      if(window.confirm("Are you sure you want to delete this coupon?")) {
          try {
              await db.ref(`coupons/${key}`).remove();
          } catch(e) {
              console.error("Error deleting coupon:", e);
              alert("Failed to delete coupon");
          }
      }
  };

  const addInspiration = async () => {
      if(!newInsp.name || !newInsp.image) return;
      await db.ref('inspiration').push(newInsp);
      setNewInsp({ name: '', image: '' });
  };

  const deleteInspiration = (id: string) => {
      if(window.confirm("Delete this inspiration item?")) {
          db.ref(`inspiration/${id}`).remove();
      }
  };

  const saveGlobalOffer = async () => {
      // Sanitization
      const offerPayload: GlobalOffer = {
          isActive: !!globalOffer.isActive,
          text: globalOffer.text || '',
          subText: globalOffer.subText || '',
          actionText: globalOffer.actionText || 'Order Now',
          gradientStart: globalOffer.gradientStart || '#9333ea',
          gradientEnd: globalOffer.gradientEnd || '#2563eb',
          textColor: '#ffffff'
      };

      try {
        await db.ref('globalOffer').set(offerPayload);
        alert("Banner configuration updated live!");
      } catch (e) {
          console.error("Failed to update banner", e);
          alert("Failed to update banner.");
      }
  };

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
        
        {/* Global Banner Configuration */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-white">
                    <LayoutTemplate className="w-5 h-5 text-purple-600"/> Modern Announcement Banner
                </h3>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase ${globalOffer.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {globalOffer.isActive ? 'Live on App' : 'Hidden'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={globalOffer.isActive}
                            onChange={e => setGlobalOffer({...globalOffer, isActive: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Headline Text</label>
                        <input 
                            type="text" 
                            placeholder="e.g. 50% OFF Everything!"
                            className="w-full border dark:border-gray-600 rounded-lg p-3 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
                            value={globalOffer.text} 
                            onChange={e => setGlobalOffer({...globalOffer, text: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Sub-headline / Description</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Use code WELCOME50"
                            className="w-full border dark:border-gray-600 rounded-lg p-3 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
                            value={globalOffer.subText || ''} 
                            onChange={e => setGlobalOffer({...globalOffer, subText: e.target.value})} 
                        />
                    </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Call to Action (Button)</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Order Now"
                            className="w-full border dark:border-gray-600 rounded-lg p-3 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
                            value={globalOffer.actionText || ''} 
                            onChange={e => setGlobalOffer({...globalOffer, actionText: e.target.value})} 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Gradient Start</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    className="h-11 w-11 p-1 rounded cursor-pointer bg-white border dark:border-gray-600"
                                    value={globalOffer.gradientStart || '#9333ea'}
                                    onChange={e => setGlobalOffer({...globalOffer, gradientStart: e.target.value})}
                                />
                                <input 
                                    type="text"
                                    className="flex-1 border dark:border-gray-600 rounded-lg px-3 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    value={globalOffer.gradientStart || '#9333ea'}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Gradient End</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    className="h-11 w-11 p-1 rounded cursor-pointer bg-white border dark:border-gray-600"
                                    value={globalOffer.gradientEnd || '#2563eb'}
                                    onChange={e => setGlobalOffer({...globalOffer, gradientEnd: e.target.value})}
                                />
                                <input 
                                    type="text"
                                    className="flex-1 border dark:border-gray-600 rounded-lg px-3 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    value={globalOffer.gradientEnd || '#2563eb'}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex flex-col h-full">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Live Preview (User App)</label>
                     <div className="flex-1 bg-gray-100 dark:bg-black rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center p-6">
                        {/* The Actual Banner */}
                        <div 
                            className="w-full rounded-2xl p-5 shadow-lg relative overflow-hidden flex justify-between items-center"
                            style={{ 
                                background: `linear-gradient(to right, ${globalOffer.gradientStart || '#9333ea'}, ${globalOffer.gradientEnd || '#2563eb'})` 
                            }}
                        >
                            <div className="relative z-10 text-white">
                                <h2 className="text-2xl font-black italic tracking-tighter mb-1 leading-none">{globalOffer.text || 'Headline'}</h2>
                                <p className="font-medium opacity-90 text-sm">{globalOffer.subText || 'Subtext goes here'}</p>
                                <button className="mt-3 bg-white text-gray-900 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                                    {globalOffer.actionText || 'Action'}
                                </button>
                            </div>
                            <div className="relative z-10 opacity-20">
                                <Sparkles className="w-16 h-16 text-white" />
                            </div>
                            
                            {/* Decorative Background Circles */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black opacity-10 rounded-full blur-xl"></div>
                        </div>
                     </div>
                     <button 
                        onClick={saveGlobalOffer} 
                        className="mt-4 w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition"
                    >
                        Save Configuration
                     </button>
                </div>
            </div>
        </section>

        {/* Coupons */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-purple-600"/> Manage Coupons
                </h3>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Code</label>
                        <input 
                            type="text" 
                            placeholder="WELCOME50" 
                            className="w-full border dark:border-gray-600 rounded-lg p-2 h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
                            value={newCoupon.code || ''} 
                            onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} 
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Description</label>
                        <input 
                            type="text" 
                            placeholder="50% Off on first order" 
                            className="w-full border dark:border-gray-600 rounded-lg p-2 h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
                            value={newCoupon.description || ''} 
                            onChange={e => setNewCoupon({...newCoupon, description: e.target.value})} 
                        />
                    </div>
                    <div className="md:col-span-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Type</label>
                        <select 
                            className="w-full border dark:border-gray-600 rounded-lg p-2 h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
                            value={newCoupon.discountType} 
                            onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value as any})}
                        >
                            <option value="FLAT">Flat ₹</option>
                            <option value="PERCENTAGE">% Off</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Value {newCoupon.discountType === 'PERCENTAGE' && '(%)'}</label>
                        <input 
                            type="number" 
                            placeholder="0" 
                            className="w-full border dark:border-gray-600 rounded-lg p-2 h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
                            value={newCoupon.value || ''} 
                            onChange={e => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})} 
                        />
                    </div>
                    <div className="md:col-span-3 grid grid-cols-2 gap-2">
                        <div>
                             <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Min Order</label>
                             <input 
                                type="number" 
                                placeholder="0" 
                                className="w-full border dark:border-gray-600 rounded-lg p-2 h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
                                value={newCoupon.minOrder || ''} 
                                onChange={e => setNewCoupon({...newCoupon, minOrder: parseFloat(e.target.value)})} 
                             />
                        </div>
                        {newCoupon.discountType === 'PERCENTAGE' && (
                             <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Max Disc</label>
                                <input 
                                    type="number" 
                                    placeholder="100" 
                                    className="w-full border dark:border-gray-600 rounded-lg p-2 h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
                                    value={newCoupon.maxDiscount || ''} 
                                    onChange={e => setNewCoupon({...newCoupon, maxDiscount: parseFloat(e.target.value)})} 
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Restrictions Section */}
                    <div className="md:col-span-12 grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-3 mt-1">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block flex items-center gap-1">
                                <Store className="w-3 h-3"/> Restaurant Specific (Optional)
                            </label>
                            <select 
                                className="w-full border dark:border-gray-600 rounded-lg p-2 h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                value={newCoupon.restaurantId || ''}
                                onChange={e => setNewCoupon({...newCoupon, restaurantId: e.target.value, category: ''})} // Reset category on rest change
                            >
                                <option value="">All Restaurants</option>
                                {restaurants.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block flex items-center gap-1">
                                <UtensilsCrossed className="w-3 h-3"/> Category Specific (Optional)
                            </label>
                            <select 
                                className="w-full border dark:border-gray-600 rounded-lg p-2 h-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                value={newCoupon.category || ''}
                                onChange={e => setNewCoupon({...newCoupon, category: e.target.value})}
                            >
                                <option value="">All Categories</option>
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {availableCategories.length === 0 && (
                                <p className="text-[10px] text-gray-400 mt-1">No categories found.</p>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-12 flex justify-between items-center pt-2">
                         <label className="flex items-center gap-2 cursor-pointer">
                             <input 
                                type="checkbox" 
                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                checked={newCoupon.validForFirstOrder || false}
                                onChange={e => setNewCoupon({...newCoupon, validForFirstOrder: e.target.checked})}
                             />
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Valid on First Order Only</span>
                         </label>
                         <button onClick={addCoupon} className="bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center gap-1 px-6 py-2.5 transition">
                            <Plus className="w-4 h-4" /> Create Coupon
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coupons.length === 0 && <p className="text-gray-400 text-sm col-span-2 text-center py-4">No coupons active.</p>}
                    {coupons.map((c, i) => (
                        <div key={c.key} className="flex justify-between items-center border border-gray-200 dark:border-gray-700 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition bg-white dark:bg-gray-800">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded text-xs border border-yellow-200 dark:border-yellow-800">{c.code}</span>
                                    {c.validForFirstOrder && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold border border-blue-200 dark:border-blue-900/50">NEW USER</span>}
                                    {c.restaurantId && <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold border border-orange-200 dark:border-orange-900/50">REST. ONLY</span>}
                                    {c.category && <span className="text-[10px] bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded font-bold border border-teal-200 dark:border-teal-900/50">CAT. ONLY</span>}
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">{c.description}</span>
                                <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-3">
                                    <span>Min: ₹{c.minOrder || 0}</span>
                                    {c.maxDiscount && c.maxDiscount > 0 && <span>Max Disc: ₹{c.maxDiscount}</span>}
                                    {c.category && <span>Cat: {c.category}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                                    {c.discountType === 'FLAT' ? `₹${c.value}` : `${c.value}%`}
                                </span>
                                <button 
                                    onClick={() => deleteCoupon(c.key)}
                                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition"
                                    title="Delete Coupon"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Inspiration */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-white"><Image className="w-5 h-5 text-blue-600"/> Inspiration Section</h3>
            </div>
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-3 mb-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <input 
                        type="text" 
                        placeholder="Dish Name (e.g. Pizza)" 
                        className="border dark:border-gray-600 rounded-lg p-2 h-10 flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
                        value={newInsp.name} 
                        onChange={e => setNewInsp({...newInsp, name: e.target.value})} 
                    />
                    <input 
                        type="text" 
                        placeholder="Image URL" 
                        className="border dark:border-gray-600 rounded-lg p-2 h-10 flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" 
                        value={newInsp.image} 
                        onChange={e => setNewInsp({...newInsp, image: e.target.value})} 
                    />
                    <button onClick={addInspiration} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold h-10 text-sm transition">Add Item</button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {inspiration.map(item => (
                        <div key={item.id} className="relative group flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full p-1 border-2 border-gray-100 dark:border-gray-700 mb-2 overflow-hidden relative">
                                <img src={item.image} className="w-full h-full rounded-full object-cover" alt={item.name} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-full">
                                    <button onClick={() => deleteInspiration(item.id)} className="text-white hover:scale-110 transition">
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-center text-sm font-bold text-gray-700 dark:text-gray-300">{item.name}</p>
                        </div>
                    ))}
                    {inspiration.length === 0 && <p className="text-gray-400 text-sm col-span-full text-center">No inspiration items found.</p>}
                </div>
            </div>
        </section>
    </div>
  );
};
