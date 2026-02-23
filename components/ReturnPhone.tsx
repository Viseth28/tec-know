
import React, { useState, useEffect, useRef } from 'react';
import { Phone, DeviceStatus } from '../types';
import { 
  ArrowDownLeft, 
  Search, 
  Scan, 
  X, 
  CheckCircle2, 
  User, 
  Calendar, 
  Trash2, 
  ShoppingCart, 
  ClipboardCheck, 
  Loader2,
  AlertCircle,
  Smartphone,
  History,
  Barcode
} from 'lucide-react';

interface ReturnPhoneProps {
  phones: Phone[];
  onUpdate: (phone: Phone) => void;
  onBatchUpdate?: (phones: Phone[]) => Promise<void>;
  initialPhone?: Phone | null;
}

export const ReturnPhone: React.FC<ReturnPhoneProps> = ({ phones, onUpdate, onBatchUpdate, initialPhone }) => {
  const [imeiInput, setImeiInput] = useState('');
  const [basket, setBasket] = useState<Phone[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const imeiInputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialPhone) {
      setBasket(prev => prev.some(p => p.id === initialPhone.id) ? prev : [...prev, initialPhone]);
    }
  }, [initialPhone]);

  useEffect(() => {
    if (imeiInput.length >= 15) {
      const cleanImei = imeiInput.trim().slice(0, 15);
      const phone = phones.find(p => p.imei1 === cleanImei || p.imei2 === cleanImei);
      
      if (phone) {
        if (phone.status === DeviceStatus.AVAILABLE) {
          triggerError(`DEVICE [${phone.model}] IS ALREADY IN STOCK`);
        } else if (basket.some(p => p.id === phone.id)) {
          triggerError('ALREADY IN QUEUE');
        } else {
          setBasket(prev => [...prev, phone]);
          setError(null);
        }
      } else {
        triggerError(`IMEI ${cleanImei} NOT FOUND IN DATABASE`);
      }
      setImeiInput('');
    }
  }, [imeiInput, phones, basket]);

  const triggerError = (msg: string) => {
    setError(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = window.setTimeout(() => setError(null), 3000);
  };

  const handleFinalizeReturn = async () => {
    setIsProcessing(true);
    
    // Prepare all updates
    const phonesToUpdate = basket.map(phone => ({
      ...phone,
      status: DeviceStatus.AVAILABLE,
      borrower: undefined,
      lastUpdate: new Date().toISOString().split('T')[0]
    }));

    // Use batch update if available, otherwise update sequentially
    if (onBatchUpdate) {
      await onBatchUpdate(phonesToUpdate);
    } else {
      for (const phone of phonesToUpdate) {
        await onUpdate(phone);
      }
    }

    setIsProcessing(false);
    setShowConfirmModal(false);
    setShowSuccessModal(true);
  };

  const resetQueue = () => {
    setBasket([]);
    setImeiInput('');
    setError(null);
  };

  const removeFromQueue = (id: string) => {
    setBasket(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Scan Input */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center">
                <ArrowDownLeft className="mr-3 text-blue-400" />
                <h3 className="text-lg font-bold">Intake Scanner</h3>
              </div>
            </div>

            <div className="p-10 space-y-8">
              <div className="text-center space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Scan size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Process Asset Return</h2>
                <p className="text-slate-500 text-sm font-medium">Scan device IMEIs to add them to the return batch.</p>
              </div>

              <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100/50 space-y-4">
                <div className="relative">
                  <Barcode className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={24} />
                  <input
                    ref={imeiInputRef}
                    autoFocus
                    className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-transparent bg-white focus:border-blue-500 font-mono text-2xl outline-none transition-all shadow-sm text-center tracking-[0.2em]"
                    placeholder="SCAN IMEI..."
                    value={imeiInput}
                    onChange={e => setImeiInput(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
                
                {error && (
                  <div className="flex items-center justify-center gap-2 text-red-500 text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                  Scanner Engine Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Return Queue */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full max-h-[calc(100vh-160px)]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center">
                <History className="mr-3 text-blue-400" size={20} />
                <h3 className="text-lg font-bold">Return Queue</h3>
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider">{basket.length} Units</span>
              </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  Staged for Re-stock
                </h4>
                
                <div className="space-y-3">
                  {basket.length === 0 ? (
                    <div className="py-24 border-2 border-dashed border-gray-50 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300">
                      <Barcode size={48} className="mb-3 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Queue Empty</p>
                      <p className="text-[9px] font-medium text-gray-400 mt-1 uppercase">Scan hardware to begin</p>
                    </div>
                  ) : (
                    basket.map((p, idx) => (
                      <div key={p.id} className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all animate-in slide-in-from-right-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black text-[10px]">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none">{p.model}</p>
                            <div className="flex items-center mt-1.5 gap-2">
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.brand}</p>
                               <span className="text-slate-300">•</span>
                               <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">From: {p.borrower?.name}</p>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromQueue(p.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            {basket.length > 0 && (
              <div className="p-8 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center transition-all shadow-xl shadow-blue-100 active:scale-95 text-xs uppercase tracking-[0.2em] gap-3"
                >
                  <ClipboardCheck size={20} />
                  Complete Batch Return
                </button>
                <button 
                   onClick={resetQueue}
                   className="w-full mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                  Cancel Batch
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <ArrowDownLeft size={32} />
              </div>
              <h4 className="text-2xl font-black text-slate-900">Confirm Return</h4>
              <p className="text-slate-500 font-medium leading-relaxed">
                You are about to return <span className="text-slate-900 font-black">{basket.length} devices</span> to the available inventory pool. Personnel assignments will be cleared.
              </p>
              
              <div className="pt-4 space-y-3">
                <button
                  onClick={handleFinalizeReturn}
                  disabled={isProcessing}
                  className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Verify & Process
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors text-xs uppercase tracking-widest"
                >
                  Back to Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-3xl p-6 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden text-center p-12 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 size={56} className="animate-in zoom-in duration-500 delay-200" />
            </div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">Batch Return Complete</h4>
            <p className="text-slate-500 font-medium mt-4 leading-relaxed">
              All devices successfully checked in and restored to general availability.
            </p>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                resetQueue();
              }}
              className="w-full mt-10 py-5 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95"
            >
              Continue Operations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
