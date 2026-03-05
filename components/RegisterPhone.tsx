
import React, { useState, useRef, useEffect } from 'react';
import { Phone, DeviceCondition, DeviceStatus, CustomFieldDefinition } from '../types';
import { 
  Smartphone, 
  Check, 
  Save, 
  RotateCcw, 
  Layers, 
  Scan, 
  History, 
  Barcode, 
  CheckCircle2,
  PackagePlus,
  ArrowRight,
  Trash2,
  ClipboardCheck,
  Loader2,
  Plus
} from 'lucide-react';

interface RegisterPhoneProps {
  onAdd: (phone: Phone) => void;
  lastIndex: number;
  customFieldDefinitions?: CustomFieldDefinition[];
}

export const RegisterPhone: React.FC<RegisterPhoneProps> = ({ 
  onAdd, 
  lastIndex, 
  customFieldDefinitions = [] 
}) => {
  const initialState = {
    brand: '',
    model: '',
    price: '',
    imei1: '',
    imei2: '',
    condition: DeviceCondition.NEW,
    customFields: {} as Record<string, any>
  };

  const [form, setForm] = useState(initialState);
  const [queue, setQueue] = useState<Phone[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(true);
  
  const imei1Ref = useRef<HTMLInputElement>(null);
  const imei2Ref = useRef<HTMLInputElement>(null);

  // Auto-queue logic when IMEI 2 is completed
  useEffect(() => {
    if (isBatchMode && form.imei1.length === 15 && form.imei2.length === 15) {
      if (form.brand && form.model && form.price) {
        addToQueue();
      }
    }
  }, [form.imei2, form.imei1, isBatchMode]);

  const addToQueue = () => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPhone: Phone = {
      id: tempId,
      brand: form.brand,
      model: form.model,
      price: Number(form.price),
      imei1: form.imei1,
      imei2: form.imei2,
      condition: form.condition,
      status: DeviceStatus.AVAILABLE,
      lastUpdate: new Date().toISOString().split('T')[0],
      customFields: { ...form.customFields }
    };
    
    setQueue(prev => [newPhone, ...prev]);
    
    // Reset scanner inputs only
    setForm(prev => ({
      ...prev,
      imei1: '',
      imei2: ''
    }));

    // Refocus scanner
    setTimeout(() => imei1Ref.current?.focus(), 10);
    
    // Quick feedback flash
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 1000);
  };

  const handleFinalizeBatch = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);

    // Process each item in queue to the actual database
    for (const phone of queue) {
      // Replace temporary ID with a real indexed ID
      const finalizedPhone = {
        ...phone,
        id: (lastIndex + Math.floor(Math.random() * 1000000)).toString()
      };
      await onAdd(finalizedPhone);
    }

    setQueue([]);
    setIsProcessing(false);
    alert(`${queue.length} devices successfully committed to inventory.`);
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleReset = () => {
    if (confirm("Clear current form and registration queue?")) {
      setForm(initialState);
      setQueue([]);
      imei1Ref.current?.focus();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6 pb-16 lg:pb-24 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Configuration & Scanner */}
        <div className="lg:col-span-7 space-y-4 lg:space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl lg:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 lg:p-6 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center">
                <PackagePlus className="mr-2 lg:mr-3 w-5 h-5" />
                <h3 className="text-base lg:text-lg font-bold">Staging Configuration</h3>
              </div>
              <div className="flex items-center bg-blue-700/50 px-2 lg:px-3 py-1.5 rounded-lg border border-blue-400/30">
                <input 
                  type="checkbox" 
                  id="batchMode" 
                  checked={isBatchMode} 
                  onChange={(e) => setIsBatchMode(e.target.checked)}
                  className="mr-2 w-4 h-4 accent-blue-400 cursor-pointer"
                />
                <label htmlFor="batchMode" className="text-[10px] font-black uppercase tracking-widest cursor-pointer select-none">
                  Auto-Queue Mode
                </label>
              </div>
            </div>
            
            <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
              {/* Batch Config */}
              <div className="bg-gray-50/50 dark:bg-slate-800/50 p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-gray-100/50 dark:border-slate-700/50 space-y-4 lg:space-y-6">
                <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Model Specification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Brand</label>
                    <input
                      required
                      className="w-full px-4 py-2.5 lg:py-2 rounded-xl border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                      placeholder="e.g. Apple"
                      value={form.brand}
                      onChange={e => setForm({...form, brand: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Model Name</label>
                    <input
                      required
                      className="w-full px-4 py-2.5 lg:py-2 rounded-xl border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                      placeholder="e.g. iPhone 15 Pro"
                      value={form.model}
                      onChange={e => setForm({...form, model: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Asset Value ($)</label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-2.5 lg:py-2 rounded-xl border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                      placeholder="0.00"
                      value={form.price}
                      onChange={e => setForm({...form, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Condition</label>
                    <select
                      className="w-full px-4 py-2.5 lg:py-2 rounded-xl border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-white"
                      value={form.condition}
                      onChange={e => setForm({...form, condition: e.target.value as DeviceCondition})}
                    >
                      <option value={DeviceCondition.NEW}>New / Factory</option>
                      <option value={DeviceCondition.USED}>Used / Fair</option>
                      <option value={DeviceCondition.BROKEN}>Damaged / Parts</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Unique Identifiers */}
              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-blue-100/50 dark:border-blue-800/50 space-y-4 lg:space-y-6">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center">
                  <Scan size={14} className="mr-2" />
                  Active Scan Inputs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">IMEI 1 (Primary)</label>
                    <input
                      ref={imei1Ref}
                      required
                      maxLength={15}
                      className="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-white dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 focus:border-blue-500 font-mono text-base lg:text-xl outline-none transition-all shadow-sm"
                      placeholder="SCAN HERE..."
                      value={form.imei1}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setForm({...form, imei1: val});
                        if (val.length === 15) imei2Ref.current?.focus();
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">IMEI 2 (Secondary)</label>
                    <input
                      ref={imei2Ref}
                      required
                      maxLength={15}
                      className="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-white dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 focus:border-blue-500 font-mono text-base lg:text-xl outline-none transition-all shadow-sm"
                      placeholder="SCAN HERE..."
                      value={form.imei2}
                      onChange={e => setForm({...form, imei2: e.target.value.replace(/[^0-9]/g, '')})}
                    />
                  </div>
                </div>
                {isBatchMode && (
                  <p className="text-[10px] font-bold text-blue-400 italic text-center animate-pulse">
                    * Item will move to queue automatically on completion
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center text-gray-400 dark:text-slate-500 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  <RotateCcw className="mr-2" size={16} />
                  Clear Current
                </button>
                <button
                  type="button"
                  onClick={addToQueue}
                  disabled={!form.imei1 || !form.imei2 || !form.brand || !form.model}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black flex items-center transition-all shadow-xl shadow-blue-100 active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  <Plus className="mr-2" size={18} />
                  Add to Queue
                </button>
              </div>
            </div>
          </div>

          {/* Staged Indicator */}
          {isSuccess && (
            <div className="bg-green-600 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl lg:rounded-[2rem] flex items-center justify-center animate-in slide-in-from-bottom-6 shadow-2xl shadow-green-100">
              <CheckCircle2 size={16} className="lg:w-[18px] lg:h-[18px] mr-2 lg:mr-3" />
              <p className="font-black text-[10px] uppercase tracking-widest">Unit Staged in Queue</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Registration Queue */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-slate-800 rounded-2xl lg:rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-full max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-160px)]">
            <div className="p-4 lg:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center">
                <History className="mr-2 lg:mr-3 text-blue-400 w-5 h-5" />
                <h3 className="text-base lg:text-lg font-bold">Registration Queue</h3>
              </div>
              <div className="bg-white/10 px-2 lg:px-3 py-1 rounded-lg border border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider">{queue.length} Staged</span>
              </div>
            </div>

            <div className="p-4 lg:p-8 flex-1 overflow-y-auto space-y-4 lg:space-y-6">
              <div className="space-y-3 lg:space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  Pending Assets
                </h4>
                
                <div className="space-y-2 lg:space-y-3">
                  {queue.length === 0 ? (
                    <div className="py-16 lg:py-24 border-2 border-dashed border-gray-50 dark:border-slate-700 rounded-2xl lg:rounded-[2rem] flex flex-col items-center justify-center text-gray-300 dark:text-slate-500">
                      <Barcode size={36} className="lg:w-12 lg:h-12 mb-2 lg:mb-3 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-center px-4 lg:px-6">Queue Empty</p>
                      <p className="text-[9px] font-medium text-gray-400 dark:text-slate-500 mt-1 uppercase text-center">Configure model & scan IMEIs to stage</p>
                    </div>
                  ) : (
                    queue.map((p, idx) => (
                      <div key={p.id} className="bg-slate-50 dark:bg-slate-700/50 px-4 lg:px-5 py-3 lg:py-4 rounded-xl lg:rounded-2xl border border-slate-100 dark:border-slate-600 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-600 hover:shadow-md transition-all animate-in slide-in-from-right-4">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-7 lg:w-8 h-7 lg:h-8 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-black text-[10px]">
                            {queue.length - idx}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-none text-sm lg:text-base">{p.model}</p>
                            <p className="text-[9px] lg:text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5">{p.brand} - {p.imei1.slice(-4)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromQueue(p.id)}
                          className="p-1.5 lg:p-2 text-gray-300 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} className="lg:w-[18px]" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Final Action Area */}
            {queue.length > 0 && (
              <div className="p-4 lg:p-8 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 shrink-0">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Batch Value</p>
                    <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">
                      ${queue.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleFinalizeBatch}
                  disabled={isProcessing}
                  className="w-full py-4 lg:py-5 bg-slate-900 hover:bg-black text-white rounded-xl lg:rounded-2xl font-black flex items-center justify-center transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 text-xs uppercase tracking-[0.2em] gap-2 lg:gap-3"
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      <ClipboardCheck size={18} className="lg:w-5 lg:h-5" />
                      Register {queue.length} Assets
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
