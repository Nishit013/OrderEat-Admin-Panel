import React, { useState } from 'react';
import { X, MapPin, Package, LogOut, User, Plus, Trash2, Navigation, Edit2, Save, Moon, Sun, ChevronRight } from 'lucide-react';
import { UserProfile, Address } from '../types';
import { db } from '../firebase';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onLogout: () => void;
  onOpenOrders: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onLogout, onOpenOrders, isDarkMode, toggleTheme }) => {
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  
  const [tempAddress, setTempAddress] = useState({ house: '', landmark: '', area: '' });
  const [locationLoading, setLocationLoading] = useState(false);

  const handleUpdateProfile = async () => {
    try {
        await db.ref(`users/${user.uid}`).update({
            name: editName,
            phone: editPhone
        });
        setIsEditing(false);
    } catch (e) {
        console.error("Error updating profile", e);
        alert("Failed to update profile");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user.addresses) return;
    const confirm = window.confirm("Are you sure you want to delete this address?");
    if (!confirm) return;

    const newAddresses = user.addresses.filter(a => a.id !== addressId);
    try {
        await db.ref(`users/${user.uid}/addresses`).set(newAddresses);
    } catch (e) {
        console.error("Error deleting address:", e);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
        () => {
            setTimeout(() => {
                setTempAddress(prev => ({
                    ...prev,
                    area: `Sector ${Math.floor(Math.random() * 50)}, New Locality`,
                    landmark: 'Near My Location'
                }));
                setLocationLoading(false);
            }, 1000);
        },
        () => {
            alert("Could not fetch location");
            setLocationLoading(false);
        }
    );
  };

  const handleSaveAddress = async () => {
      if (!tempAddress.house || !tempAddress.area) {
          alert("Please fill address details");
          return;
      }
      const newAddr: Address = {
          id: Date.now().toString(),
          type: 'Home', 
          houseNo: tempAddress.house,
          area: tempAddress.area,
          landmark: tempAddress.landmark,
          lat: 28.6139, 
          lng: 77.2090  
      };
      const currentAddresses = user.addresses || [];
      const updatedAddresses = [...currentAddresses, newAddr];

      try {
          await db.ref(`users/${user.uid}/addresses`).set(updatedAddresses);
          setShowAddAddress(false);
          setTempAddress({ house: '', landmark: '', area: '' });
      } catch (e) {
          console.error("Error saving address", e);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Modern Header */}
        <div className="p-6 pb-8 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 text-white relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 p-32 bg-purple-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             
             <div className="relative z-10 flex justify-between items-start mb-6">
                <button 
                  onClick={toggleTheme} 
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition border border-white/10 text-xs font-medium"
                >
                    {isDarkMode ? <Sun className="w-4 h-4 text-yellow-300" /> : <Moon className="w-4 h-4" />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
                    <X className="w-5 h-5 text-white" />
                </button>
             </div>

             <div className="relative z-10 flex items-center gap-5">
                <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full p-1 shadow-xl">
                   <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                      {user.name?.charAt(0).toUpperCase()}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                     {isEditing ? (
                        <div className="space-y-2">
                             <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full text-sm px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:bg-white/20 placeholder-white/50"
                                placeholder="Name"
                             />
                             <input 
                                type="tel" 
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="w-full text-sm px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:bg-white/20 placeholder-white/50"
                                placeholder="Phone"
                             />
                             <div className="flex gap-2">
                                <button onClick={handleUpdateProfile} className="text-xs bg-green-500 text-white px-3 py-1 rounded font-bold">Save</button>
                                <button onClick={() => setIsEditing(false)} className="text-xs bg-white/20 text-white px-3 py-1 rounded">Cancel</button>
                             </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-2xl truncate">{user.name}</h3>
                                <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-white/10 rounded-full transition opacity-70 hover:opacity-100">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm truncate">{user.email}</p>
                            <p className="text-gray-400 text-sm">{user.phone || '+91 XXXXX XXXXX'}</p>
                        </div>
                    )}
                </div>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 space-y-6">
            
            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-800">
                <button 
                    onClick={onOpenOrders}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Package className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">Orders</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Review your order history</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
                </button>
            </div>

            {/* Address Section */}
            <div>
                 <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">Address Book</h3>
                    <button 
                        onClick={() => setShowAddAddress(!showAddAddress)}
                        className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase hover:bg-purple-50 dark:hover:bg-purple-900/30 px-3 py-1.5 rounded-full transition flex items-center gap-1 bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-900"
                    >
                        {showAddAddress ? 'Cancel' : <><Plus className="w-3.5 h-3.5" /> Add New</>}
                    </button>
                </div>

                {showAddAddress && (
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-900 mb-6 animate-in slide-in-from-top-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">New Address Details</h4>
                        <div className="space-y-4">
                             <button 
                                onClick={handleLocateMe}
                                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
                            >
                                {locationLoading ? 'Locating...' : <><Navigation className="w-4 h-4" /> Detect Current Location</>}
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <input 
                                    type="text" 
                                    placeholder="House No." 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 bg-gray-50 dark:bg-gray-800 dark:text-white transition"
                                    value={tempAddress.house}
                                    onChange={e => setTempAddress({...tempAddress, house: e.target.value})}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Area / Locality" 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 bg-gray-50 dark:bg-gray-800 dark:text-white transition"
                                    value={tempAddress.area}
                                    onChange={e => setTempAddress({...tempAddress, area: e.target.value})}
                                />
                            </div>
                            <button onClick={handleSaveAddress} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-md shadow-purple-200 dark:shadow-purple-900/30 transition">Save Address</button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {user.addresses && user.addresses.length > 0 ? (
                        user.addresses.map((addr) => (
                            <div key={addr.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 group hover:border-purple-200 dark:hover:border-purple-800 transition">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mt-1 text-gray-500 dark:text-gray-400">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm block mb-1">{addr.type}</span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">
                                                {addr.houseNo}, {addr.area}
                                                {addr.landmark && <span className="block text-gray-400 mt-0.5">{addr.landmark}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteAddress(addr.id)}
                                        className="text-gray-300 hover:text-red-500 transition p-2 opacity-0 group-hover:opacity-100"
                                        title="Delete Address"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No addresses saved yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
             <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition text-sm"
            >
                <LogOut className="w-4 h-4" /> Log Out
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-2">App Version 2.4.0</p>
        </div>

      </div>
    </div>
  );
};