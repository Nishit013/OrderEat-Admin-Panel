import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { DeliveryPartner } from '../../types';
import { Bike, Phone, Trash2, CheckCircle, Ban } from 'lucide-react';

export const PartnerManager: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = db.ref('deliveryPartners');
    const listener = ref.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.keys(data).map(key => ({...data[key], id: key}));
            setPartners(list);
        } else {
            setPartners([]);
        }
        setLoading(false);
    });
    return () => ref.off('value', listener);
  }, []);

  const toggleApproval = (id: string, currentStatus: boolean) => {
      db.ref(`deliveryPartners/${id}`).update({ isApproved: !currentStatus });
  };

  const handleDelete = (id: string) => {
      if (window.confirm("Are you sure you want to delete this partner?")) {
          db.ref(`deliveryPartners/${id}`).remove();
      }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Delivery Partner Management</h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                        <th className="p-4">Partner</th>
                        <th className="p-4">Vehicle</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                    {partners.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name}/> : <Bike className="w-5 h-5 text-gray-400"/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white">{p.name}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3"/> {p.phone}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{p.vehicleType}</span>
                                <p className="text-xs text-gray-400 uppercase">{p.vehicleNumber}</p>
                            </td>
                            <td className="p-4">
                                <button 
                                    onClick={() => toggleApproval(p.id, p.isApproved)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${p.isApproved ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                                >
                                    {p.isApproved ? <CheckCircle className="w-3 h-3"/> : <Ban className="w-3 h-3"/>}
                                    {p.isApproved ? 'Active' : 'Banned'}
                                </button>
                            </td>
                            <td className="p-4 text-right">
                                <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>
    </div>
  );
};
