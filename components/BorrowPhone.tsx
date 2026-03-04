
import React, { useState, useEffect, useRef } from 'react';
import { Phone, DeviceStatus } from '../types';
import { DEPARTMENTS } from '../constants';
import * as htmlToImage from 'html-to-image';
import { 
  User, 
  Smartphone, 
  AlertCircle, 
  Trash2, 
  Printer, 
  Barcode,
  Loader2,
  Scan,
  CheckCircle2,
  Download,
  Save,
  ClipboardList,
  Image as ImageIcon,
  ShoppingCart,
  FileText
} from 'lucide-react';

interface BorrowPhoneProps {
  phones: Phone[];
  onUpdate: (phone: Phone) => void;
  onBatchUpdate?: (phones: Phone[]) => Promise<void>;
  initialPhone?: Phone | null;
}

interface BorrowSession {
  phones: Phone[];
  borrowerName: string;
  department: string;
  date: string;
  invoiceId: string;
}

export const BorrowPhone: React.FC<BorrowPhoneProps> = ({ phones, onUpdate, onBatchUpdate, initialPhone }) => {
  const [imeiInput, setImeiInput] = useState('');
  const [basket, setBasket] = useState<Phone[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [department, setDepartment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [activeSession, setActiveSession] = useState<BorrowSession | null>(null);
  // If navigated from inventory with a single phone, it will be provided here
  useEffect(() => {
    if (initialPhone) {
      setBasket(prev => prev.some(p => p.id === initialPhone.id) ? prev : [...prev, initialPhone]);
    }
  }, [initialPhone]);

  const imeiInputRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const errorTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (imeiInput.length >= 15) {
      const cleanImei = imeiInput.trim().slice(0, 15);
      const phone = phones.find(p => p.imei1 === cleanImei || p.imei2 === cleanImei);
      
      if (phone) {
        if (phone.status !== DeviceStatus.AVAILABLE) {
          triggerError(`DEVICE [${phone.model}] ALREADY BORROWED`);
        } else if (basket.some(p => p.id === phone.id)) {
          triggerError('ALREADY IN QUEUE');
        } else {
          setBasket(prev => [...prev, phone]);
          setError(null);
        }
      } else {
        triggerError(`IMEI ${cleanImei} NOT FOUND`);
      }
      setImeiInput('');
    }
  }, [imeiInput, phones, basket]);

  const triggerError = (msg: string) => {
    setError(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = window.setTimeout(() => setError(null), 3000);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const options = {
        backgroundColor: '#ffffff',
        pixelRatio: 4, 
        cacheBust: true,
      };

      const dataUrl = await htmlToImage.toPng(invoiceRef.current, options);
      
      const link = document.createElement('a');
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      const filename = `invoice_${randomNumber}.png`;
      
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(`Failed to generate PNG`, err);
    }
  };

  const handleCompleteTransaction = async () => {
    if (basket.length === 0 || !borrowerName || !department) return;
    setIsProcessing(true);

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const invoiceId = generateRandomCode();

    const session: BorrowSession = {
      phones: [...basket],
      borrowerName,
      department,
      date: formattedDate,
      invoiceId
    };
    
    setActiveSession(session);

    // Prepare all updates
    const phonesToUpdate = basket.map(phone => ({
      ...phone,
      status: DeviceStatus.ON_BORROW,
      borrower: {
        name: borrowerName,
        department,
        date: new Date().toISOString().split('T')[0]
      },
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
    setShowSuccessModal(true);
  };

  const resetForm = () => {
    setBasket([]);
    setBorrowerName('');
    setDepartment('');
    setActiveSession(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentTotal = basket.reduce((sum, p) => sum + (p.price || 0), 0);

  const displayData = activeSession || {
    borrowerName,
    department,
    phones: basket,
    date: new Date().toLocaleString(),
    invoiceId: 'PREVIEW'
  };

  const isFormValid = basket.length > 0 && borrowerName.trim() !== '' && department.trim() !== '';

  return (
    <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6 pb-16 lg:pb-24 animate-in fade-in duration-500">
      <style>{`
        .print-layout { 
          background: white;
          width: 210mm;
          min-height: 297mm;
          display: flex;
          flex-direction: column;
          position: relative;
          padding: 8mm 15mm;
          box-sizing: border-box;
        }

        @media screen {
          .capture-container {
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 210mm;
            height: auto;
            overflow: hidden;
            pointer-events: none;
            z-index: -1000;
          }
        }

        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden !important; }
          .print-layout, .print-layout * { 
            visibility: visible !important;
            display: block !important;
          }
          .print-layout {
            display: flex !important;
            flex-direction: column !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 8mm 15mm !important;
            margin: 0 !important;
            color: black !important;
            background: white !important;
            box-sizing: border-box !important;
          }
          table { display: table !important; width: 100% !important; border-collapse: collapse !important; border: none !important; }
          thead { display: table-header-group !important; }
          tbody { display: table-row-group !important; }
          tr { display: table-row !important; page-break-inside: avoid !important; }
          th, td { display: table-cell !important; padding: 6pt 6pt !important; vertical-align: middle !important; border-bottom: 0.5pt solid black !important; }
        }
      `}</style>

      {/* HIDDEN CAPTURE TEMPLATE */}
      <div className="capture-container">
        <div ref={invoiceRef} className="print-layout" style={{ fontFamily: "'Inter', sans-serif", fontSize: '8.5pt', color: 'black' }}>
          <div style={{ borderBottom: '2px solid black', paddingBottom: '6pt', marginBottom: '8pt', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'block' }}>
              <h1 style={{ fontSize: '18pt', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Inventory Handover</h1>
              <p style={{ margin: '1pt 0 0', fontWeight: '700', fontSize: '9pt', opacity: 0.7 }}>TECNO Asset Management</p>
            </div>
            <div style={{ textAlign: 'right', display: 'block' }}>
              {displayData.invoiceId !== 'PREVIEW' && (
                <p style={{ margin: 0, fontWeight: '900', fontSize: '11pt', color: '#1e40af' }}>ID: {displayData.invoiceId}</p>
              )}
              <p style={{ margin: '1pt 0 0', opacity: 0.7, fontSize: '8pt', fontWeight: '700' }}>{displayData.date}</p>
            </div>
          </div>

          <div style={{ marginBottom: '10pt', display: 'flex' }}>
            <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '10pt', borderRadius: '8pt', border: '0.5pt solid #cbd5e1', display: 'block' }}>
              <p style={{ margin: '0 0 2pt', textTransform: 'uppercase', fontSize: '7pt', fontWeight: '900', color: '#64748b', letterSpacing: '0.5px' }}>Recipient Details</p>
              <p style={{ margin: 0, fontSize: '11pt', fontWeight: '900', color: '#0f172a' }}>{displayData.borrowerName || 'UNSPECIFIED'}</p>
              <p style={{ margin: '1pt 0 0', fontSize: '9pt', fontWeight: '700', color: '#475569' }}>{displayData.department || 'PENDING'}</p>
            </div>
          </div>

          <table style={{ width: '100%', marginBottom: '8pt', borderCollapse: 'collapse', border: 'none' }}>
            <thead>
              <tr>
                <th style={{ width: '30pt', textAlign: 'center', fontWeight: '900', fontSize: '8pt', borderBottom: '1.5pt solid black', padding: '6pt 6pt' }}>#</th>
                <th style={{ textAlign: 'left', fontWeight: '900', fontSize: '8pt', borderBottom: '1.5pt solid black', padding: '6pt 6pt' }}>Description</th>
                <th style={{ textAlign: 'left', fontWeight: '900', fontSize: '8pt', borderBottom: '1.5pt solid black', padding: '6pt 6pt' }}>IMEI / Serial</th>
                <th style={{ width: '70pt', textAlign: 'right', fontWeight: '900', fontSize: '12pt', borderBottom: '1.5pt solid black', padding: '6pt 6pt' }}>Value ($)</th>
              </tr>
            </thead>
            <tbody>
              {displayData.phones.length > 0 ? displayData.phones.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ textAlign: 'center', fontWeight: '700', borderBottom: '0.5pt solid black', padding: '8pt 6pt' }}>{i + 1}</td>
                  <td style={{ borderBottom: '0.5pt solid black', padding: '8pt 6pt' }}>
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '15pt' }}>{p.brand} {p.model}</p>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12pt', letterSpacing: '0.2px', borderBottom: '0.5pt solid black', padding: '8pt 6pt' }}>
                    I1: {p.imei1}<br/>
                    I2: {p.imei2}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '900', borderBottom: '0.5pt solid black', padding: '8pt 6pt' }}>{p.price.toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '15pt', color: '#94a3b8', fontStyle: 'italic', borderBottom: '0.5pt solid black' }}>No Items Scanned</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginBottom: '15pt', display: 'flex', justifyContent: 'flex-end', paddingRight: '6pt' }}>
            <div style={{ textAlign: 'right', display: 'block' }}>
              <p style={{ margin: '0 0 2pt', textTransform: 'uppercase', fontSize: '7pt', fontWeight: '900', color: '#64748b', letterSpacing: '1px' }}>Total Asset Valuation</p>
              <p style={{ margin: 0, fontSize: '22pt', fontWeight: '900', color: '#1e40af', borderBottom: '4pt solid #1e40af', display: 'inline-block', paddingBottom: '2pt', letterSpacing: '-1px' }}>
                ${displayData.phones.reduce((s, p) => s + p.price, 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{ marginBottom: '15pt', display: 'block' }}>
              <h2 style={{ fontSize: '9.5pt', fontWeight: '900', textTransform: 'uppercase', borderBottom: '1px solid black', paddingBottom: '2pt', marginBottom: '6pt', letterSpacing: '0.5px' }}>Policy Acknowledgement</h2>
              <div style={{ fontSize: '7.5pt', color: '#334155', lineHeight: '1.4' }}>
                <p style={{ margin: '2pt 0' }}>• Recipient confirms the hardware is received in fully operational and functional condition.</p>
                <p style={{ margin: '2pt 0' }}>• Assets remain the property of TECNO and must be returned upon request or exit.</p>
                <p style={{ margin: '2pt 0' }}>• Recipient assumes financial liability for damage or loss resulting from misuse or negligence.</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '5mm' }}>
              <div style={{ width: '180pt', textAlign: 'center', display: 'block' }}>
                <div style={{ borderBottom: '1.5px solid black', marginBottom: '6pt', height: '30pt' }}></div>
                <p style={{ margin: 0, fontWeight: '900', fontSize: '8.5pt', textTransform: 'uppercase' }}>Borrower Signature</p>
                <p style={{ margin: '1pt 0 0', fontSize: '7.5pt', opacity: 0.5, fontWeight: '700' }}>{displayData.borrowerName || '(Full Name)'}</p>
              </div>
              <div style={{ width: '180pt', textAlign: 'center', display: 'block' }}>
                <div style={{ borderBottom: '1.5px solid black', marginBottom: '6pt', height: '30pt' }}></div>
                <p style={{ margin: 0, fontWeight: '900', fontSize: '8.5pt', textTransform: 'uppercase' }}>Giver Signature</p>
                <p style={{ margin: '1pt 0 0', fontSize: '7.5pt', opacity: 0.5, fontWeight: '700' }}>Infrastructure Control</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start no-print">
        {/* LEFT COLUMN: Scan & Info */}
        <div className="lg:col-span-7 space-y-4 lg:space-y-6">
          <div className="bg-white rounded-2xl lg:rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 lg:p-6 bg-blue-600 text-white flex items-center">
              <Smartphone className="mr-2 lg:mr-3 w-5 h-5" />
              <h3 className="text-base lg:text-lg font-bold">Handover Configuration</h3>
            </div>

            <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
              {/* Scan Section */}
              <div className="bg-blue-50/50 p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-blue-100/50 space-y-4">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Asset Identification
                </h4>
                <div className="relative">
                  <Scan className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" size={20} />
                  <input
                    ref={imeiInputRef}
                    autoFocus
                    className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 rounded-xl border-2 border-transparent bg-white focus:border-blue-500 font-mono text-base lg:text-lg outline-none transition-all shadow-sm"
                    placeholder="Scan IMEI barcode..."
                    value={imeiInput}
                    onChange={e => setImeiInput(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-[11px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Recipient Section */}
              <div className="bg-gray-50/50 p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-gray-100/50 space-y-4 lg:space-y-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
                  <User size={14} className="mr-2" />
                  Recipient Authorization
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Full Name</label>
                    <input
                      required
                      className="w-full px-4 py-2.5 lg:py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                      placeholder="Enter recipient name..."
                      value={borrowerName}
                      onChange={e => setBorrowerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Department</label>
                    <input
                      list="dept-list-borrow"
                      required
                      className="w-full px-4 py-2.5 lg:py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                      placeholder="Type or select..."
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                    />
                    <datalist id="dept-list-borrow">
                      {DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Left Column */}
              <div className="pt-4 lg:pt-6 border-t border-gray-100 space-y-3 lg:space-y-4">
                <button
                  onClick={handleCompleteTransaction}
                  disabled={!isFormValid || isProcessing}
                  className="w-full py-4 lg:py-5 bg-blue-600 disabled:bg-gray-100 disabled:text-gray-300 hover:bg-blue-700 text-white font-black rounded-xl lg:rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-blue-100 active:scale-95 text-sm uppercase tracking-widest"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="mr-2 w-5 h-5" size={20} />}
                  Complete System Log
                </button>
                
                <button
                  onClick={downloadImage}
                  disabled={!isFormValid || isProcessing}
                  className="w-full flex items-center justify-center py-3 lg:py-4 bg-slate-900 disabled:bg-gray-100 disabled:text-gray-300 hover:bg-black text-white font-black rounded-xl lg:rounded-2xl transition-all shadow-lg active:scale-95 text-[10px] uppercase tracking-[0.2em]"
                >
                  <FileText className="mr-2 w-4 h-4" size={16} />
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Queue Card */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl lg:rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-160px)]">
            <div className="p-4 lg:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center">
                <ShoppingCart className="mr-2 lg:mr-3 text-blue-400 w-5 h-5" />
                <h3 className="text-base lg:text-lg font-bold">Handover Queue</h3>
              </div>
              <div className="bg-white/10 px-2 lg:px-3 py-1 rounded-lg border border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider">{basket.length} Units</span>
              </div>
            </div>
            
            <div className="p-4 lg:p-8 flex-1 overflow-y-auto space-y-4 lg:space-y-6">
              <div className="space-y-3 lg:space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
                  <ClipboardList size={14} className="mr-2" />
                  Queued Assets
                </h4>
                
                <div className="space-y-2 lg:space-y-3">
                  {basket.length === 0 ? (
                    <div className="py-16 lg:py-20 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                      <Barcode size={36} className="lg:w-12 lg:h-12 mb-2 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No assets queued</p>
                      <p className="text-[9px] font-medium text-gray-400 mt-1">Scan IMEI to begin</p>
                    </div>
                  ) : (
                    basket.map((p, idx) => (
                      <div key={p.id} className="bg-gray-50 px-4 lg:px-5 py-3 lg:py-4 rounded-xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-7 lg:w-8 h-7 lg:h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-none text-sm lg:text-base">{p.model}</p>
                            <p className="text-[9px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{p.brand} - {p.imei1.slice(-6)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setBasket(basket.filter(b => b.id !== p.id))}
                          className="p-1.5 lg:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} className="lg:w-[18px]" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {basket.length > 0 && (
                <div className="pt-4 lg:pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Asset Value</p>
                      <p className="text-xl lg:text-2xl font-black text-slate-900">${currentTotal.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && activeSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4 lg:p-6 animate-in fade-in duration-500 no-print">
          <div className="bg-white w-full max-w-lg rounded-2xl lg:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 lg:p-12 text-center bg-green-50 border-b border-green-100">
              <div className="w-16 lg:w-20 h-16 lg:h-20 bg-white text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-xl">
                <CheckCircle2 size={36} className="lg:w-11 lg:h-11" />
              </div>
              <h4 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Verified</h4>
              <p className="text-green-700 font-black mt-2 text-xs uppercase tracking-[0.2em]">Hardware Dispatched</p>
            </div>
            
            <div className="p-6 lg:p-10 space-y-6 lg:space-y-8">
              <p className="text-center text-gray-500 font-medium leading-relaxed text-sm lg:text-base">
                Transaction ID <span className="text-slate-900 font-black">{activeSession.invoiceId}</span> completed. Manifest successfully logged.
              </p>
              
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <button 
                  onClick={handlePrint}
                  className="flex flex-col items-center justify-center py-4 lg:py-6 bg-slate-900 text-white font-bold rounded-xl lg:rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  <Printer size={24} className="lg:w-8 lg:h-8 mb-2" />
                  <span className="text-[10px] uppercase tracking-widest">Print Paper</span>
                </button>
                <button 
                  onClick={downloadImage}
                  className="flex flex-col items-center justify-center py-4 lg:py-6 bg-blue-600 text-white font-bold rounded-xl lg:rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  <Download size={24} className="lg:w-8 lg:h-8 mb-2" />
                  <span className="text-[10px] uppercase tracking-widest">Download Invoice</span>
                </button>
              </div>
              
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  resetForm();
                }}
                className="w-full py-3 lg:py-4 text-gray-400 font-bold hover:text-slate-900 transition-colors bg-gray-50 rounded-xl uppercase tracking-widest text-[10px]"
              >
                Close Handover Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
