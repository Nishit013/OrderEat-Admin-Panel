import React from 'react';
import { X, MapPin, CheckCircle2, Plus } from 'lucide-react';
import { UserProfile, Address } from '../types';

interface AddressSwitchModalProps {
  user: UserProfile;
  currentLocationName: string;
  onClose: () => void;
  onSelectAddress: (address: Address) => void;
  onAddNew: () => void;
}

export const AddressSwitchModal: React.FC<AddressSwitchModalProps> = ({ 
  user, 
  currentLocationName, 
  onClose, 
  onSelectAddress,
  onAddNew 
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
       <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
             <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Switch Location</h3>
             <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
             </button>
          </div>
          
          <div className="p-4 max-h-[60vh] overflow-y-auto bg-white dark:bg-gray-900">
             <button 
                onClick={onAddNew}
                className="w-full flex items-center gap-3 p-4 mb-4 bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-900/50 rounded-xl shadow-sm text-purple-600 dark:text-purple-400 font-bold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
            >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                </div>
                Add New Address
            </button>

            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Saved Addresses</h4>
            {user.addresses && user.addresses.length > 0 ? (
                <div className="space-y-3">
                    {user.addresses.map(addr => {
                        const addrString = `${addr.houseNo}, ${addr.area}`;
                        const isSelected = currentLocationName === addrString;
                        
                        return (
                            <div 
                                key={addr.id}
                                onClick={() => onSelectAddress(addr)}
                                className={`p-4 bg-white dark:bg-gray-900 border rounded-xl shadow-sm cursor-pointer flex items-start gap-3 transition ${isSelected ? 'border-purple-600 ring-1 ring-purple-100 dark:ring-purple-900 bg-purple-50/20' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
                            >
                                <MapPin className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{addr.type}</span>
                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {addr.houseNo}, {addr.area}
                                        {addr.landmark && <br/>}
                                        {addr.landmark}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-400 text-sm py-8">No saved addresses found.</p>
            )}
          </div>
       </div>
    </div>
  );
};