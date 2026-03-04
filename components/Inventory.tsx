
import React, { useState, useMemo } from 'react';
import { Phone, DeviceCondition, DeviceStatus, CustomFieldDefinition } from '../types';
import { Search, Filter, Smartphone, Edit2, Trash2, X, Save, AlertTriangle, Layers, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface InventoryProps {
  phones: Phone[];
  onUpdate: (phone: Phone) => void;
  onDelete: (id: string) => void;
  customFieldDefinitions?: CustomFieldDefinition[];
  onNavigateToBorrow?: (phone: Phone) => void;
  onNavigateToReturn?: (phone: Phone) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ 
  phones, 
  onUpdate, 
  onDelete, 
  customFieldDefinitions = [],
  onNavigateToBorrow,
  onNavigateToReturn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('All');
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredPhones = useMemo(() => {
    return phones.filter(phone => {
      const matchesSearch = 
        phone.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
        phone.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.imei1.includes(searchTerm) ||
        phone.imei2.includes(searchTerm);
      
      const matchesCondition = conditionFilter === 'All' || phone.condition === conditionFilter;
      
      return matchesSearch && matchesCondition;
    });
  }, [phones, searchTerm, conditionFilter]);

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.AVAILABLE: return 'bg-green-100 text-green-700';
      case DeviceStatus.ON_BORROW: return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getConditionColor = (condition: DeviceCondition) => {
    switch (condition) {
      case DeviceCondition.NEW: return 'text-blue-600';
      case DeviceCondition.USED: return 'text-amber-600';
      case DeviceCondition.BROKEN: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPhone) {
      onUpdate(editingPhone);
      setEditingPhone(null);
    }
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col md:flex-row gap-3 lg:gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search brand, model, or IMEI..."
            className="w-full pl-10 pr-4 py-2.5 lg:py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="text-gray-400" size={18} />
          <select
            className="flex-1 md:flex-none px-4 py-2.5 lg:py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
          >
            <option value="All">All Conditions</option>
            <option value={DeviceCondition.NEW}>New</option>
            <option value={DeviceCondition.USED}>Used</option>
            <option value={DeviceCondition.BROKEN}>Broken</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl lg:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                <th className="px-4 lg:px-6 py-3 lg:py-4 min-w-[180px]">Hardware Profile</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 w-[140px]">IMEI 1</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 w-[140px]">IMEI 2</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 w-[100px]">Condition</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 w-[110px]">Status</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 min-w-[130px]">With</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-right w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPhones.map((phone) => (
                <tr key={phone.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl mr-3 lg:mr-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0">
                        <Smartphone size={18} className="lg:w-5 lg:h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm lg:text-base font-black text-slate-900 leading-tight mb-0.5 truncate">{phone.model}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{phone.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 inline-block max-w-[120px] lg:max-w-none overflow-hidden">
                      <p className="text-[10px] lg:text-[11px] font-mono font-black text-slate-700 tracking-normal truncate">{phone.imei1}</p>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <div className="bg-slate-50/50 px-2 py-1 rounded-lg border border-slate-100/50 inline-block max-w-[120px] lg:max-w-none overflow-hidden">
                      <p className="text-[10px] lg:text-[11px] font-mono font-bold text-slate-500 tracking-normal truncate">{phone.imei2}</p>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className={`text-[10px] lg:text-xs font-black uppercase tracking-wider ${getConditionColor(phone.condition)}`}>
                      {phone.condition}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className={`px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${getStatusColor(phone.status)} whitespace-nowrap`}>
                      {phone.status}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    {phone.borrower ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 lg:w-7 h-6 lg:h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[9px] lg:text-[10px] font-black shrink-0">
                          {phone.borrower.name.charAt(0)}
                        </div>
                        <div className="truncate max-w-[100px] lg:max-w-none">
                          <p className="text-xs font-bold text-slate-900 truncate">{phone.borrower.name}</p>
                          <p className="text-[9px] lg:text-[10px] text-slate-400 uppercase font-bold tracking-tighter truncate">{phone.borrower.department}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] lg:text-[10px] font-black text-slate-300 uppercase tracking-widest">In Stock</span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                    <div className="flex items-center justify-end space-x-0.5 lg:space-x-1">
                      {phone.status === DeviceStatus.AVAILABLE ? (
                        <button
                          onClick={() => onNavigateToBorrow?.(phone)}
                          className="p-1.5 lg:p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                          title="Borrow"
                        >
                          <ArrowUpRight size={16} className="lg:w-[18px]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigateToReturn?.(phone)}
                          className="p-1.5 lg:p-2 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded-xl transition-all"
                          title="Return"
                        >
                          <ArrowDownLeft size={16} className="lg:w-[18px]" />
                        </button>
                      )}

                      <button 
                        onClick={() => setEditingPhone(phone)}
                        className="p-1.5 lg:p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                        title="Edit Device"
                      >
                        <Edit2 size={16} className="lg:w-[18px]" />
                      </button>
                      <button 
                        onClick={() => setDeletingId(phone.id)}
                        className="p-1.5 lg:p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                        title="Delete Device"
                      >
                        <Trash2 size={16} className="lg:w-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPhones.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 lg:px-6 py-12 lg:py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Smartphone size={48} className="lg:w-16 lg:h-16 text-slate-400 mb-3 lg:mb-4" />
                      <p className="text-slate-900 font-black uppercase tracking-widest text-xs lg:text-sm">No Hardware Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl lg:rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh] relative animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 bg-white p-4 lg:p-8 border-b border-gray-100 flex items-center justify-between z-10">
              <h3 className="text-lg lg:text-2xl font-bold text-gray-900">Edit Device</h3>
              <button onClick={() => setEditingPhone(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-all">
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-4 lg:p-8 space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Brand</label>
                  <input
                    required
                    className="w-full px-4 py-2.5 lg:py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingPhone.brand}
                    onChange={e => setEditingPhone({...editingPhone, brand: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Model</label>
                  <input
                    required
                    className="w-full px-4 py-2.5 lg:py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingPhone.model}
                    onChange={e => setEditingPhone({...editingPhone, model: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Price ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2.5 lg:py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingPhone.price}
                    onChange={e => setEditingPhone({...editingPhone, price: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Condition</label>
                  <select
                    className="w-full px-4 py-2.5 lg:py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingPhone.condition}
                    onChange={e => setEditingPhone({...editingPhone, condition: e.target.value as DeviceCondition})}
                  >
                    <option value={DeviceCondition.NEW}>New</option>
                    <option value={DeviceCondition.USED}>Used</option>
                    <option value={DeviceCondition.BROKEN}>Broken</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Custom Fields in Edit Mode */}
              {customFieldDefinitions.length > 0 && (
                <div className="pt-3 lg:pt-4 space-y-3 lg:space-y-4 border-t border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <Layers size={14} className="mr-2" />
                    Custom Attributes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    {customFieldDefinitions.map((field) => (
                      <div key={field.id} className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">{field.label}</label>
                        <input
                          type={field.type}
                          className="w-full px-4 py-2.5 lg:py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          value={editingPhone.customFields?.[field.id] || ''}
                          onChange={e => setEditingPhone({
                            ...editingPhone, 
                            customFields: { 
                              ...(editingPhone.customFields || {}), 
                              [field.id]: e.target.value 
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">IMEI 1</label>
                <input
                  required
                  maxLength={15}
                  className="w-full px-4 py-2.5 lg:py-2 bg-gray-50 border rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingPhone.imei1}
                  onChange={e => setEditingPhone({...editingPhone, imei1: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">IMEI 2</label>
                <input
                  required
                  maxLength={15}
                  className="w-full px-4 py-2.5 lg:py-2 bg-gray-50 border rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingPhone.imei2}
                  onChange={e => setEditingPhone({...editingPhone, imei2: e.target.value})}
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 lg:pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingPhone(null)}
                  className="flex-1 py-3 border-2 border-gray-100 font-bold text-gray-500 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center"
                >
                  <Save size={18} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* quick borrow modal removed — navigation flow used instead */}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl lg:rounded-[2rem] shadow-2xl p-6 lg:p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-12 lg:w-16 h-12 lg:h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
              <AlertTriangle size={24} className="lg:w-8 lg:h-8" />
            </div>
            <h3 className="text-lg lg:text-2xl font-bold text-gray-900 mb-2">Are you sure?</h3>
            <p className="text-gray-500 text-sm mb-6 lg:mb-8">This action will permanently remove this device from your inventory system.</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={confirmDelete}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
              >
                Yes, Delete Device
              </button>
              <button 
                onClick={() => setDeletingId(null)}
                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                No, Keep Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
