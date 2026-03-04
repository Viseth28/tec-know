
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Smartphone, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  History,
  Activity,
  HardDrive,
  Clock,
  User,
  ShieldAlert,
  Download
} from 'lucide-react';
import { Phone, DeviceStatus, DeviceCondition, ActivityEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dbService } from '../services/db';
import * as htmlToImage from 'html-to-image';

interface DashboardProps {
  phones: Phone[];
  logs: ActivityEntry[];
  onDownloadInvoice: (log: ActivityEntry) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ phones, logs, onDownloadInvoice }) => {
  const storageMode = dbService.getMode();
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (invoiceData && invoiceRef.current) {
      const generateImage = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          const dataUrl = await htmlToImage.toPng(invoiceRef.current!, { quality: 1.0, backgroundColor: 'white', pixelRatio: 4 });
          const link = document.createElement('a');
          link.download = `Invoice_${invoiceData.invoiceId}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error('Invoice generation failed', err);
        } finally {
          setInvoiceData(null);
        }
      };
      generateImage();
    }
  }, [invoiceData]);

  const stats = useMemo(() => {
    const total = phones.length;
    const available = phones.filter(p => p.status === DeviceStatus.AVAILABLE).length;
    return {
      total,
      onBorrow: phones.filter(p => p.status === DeviceStatus.ON_BORROW).length,
      available,
      broken: phones.filter(p => p.condition === DeviceCondition.BROKEN).length,
      health: total > 0 ? Math.round((available / total) * 100) : 0
    };
  }, [phones]);

  const modelData = useMemo(() => {
    const distribution = phones.reduce((acc, p) => {
      acc[p.model] = (acc[p.model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [phones]);

  const getLogIcon = (action: string) => {
    switch (action) {
      case 'REGISTER': return <Smartphone size={14} className="text-blue-500" />;
      case 'UPDATE': return <Activity size={14} className="text-green-500" />;
      case 'DELETE': return <ShieldAlert size={14} className="text-red-500" />;
      case 'CONFIG': return <ShieldAlert size={14} className="text-indigo-500" />;
      default: return <Clock size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HIDDEN INVOICE TEMPLATE */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', pointerEvents: 'none' }}>
        {invoiceData && (
           <div ref={invoiceRef} style={{ width: '210mm', minHeight: '297mm', padding: '8mm 15mm', backgroundColor: 'white', fontFamily: "'Inter', sans-serif", fontSize: '8.5pt', color: 'black', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
              <div style={{ borderBottom: '2px solid black', paddingBottom: '6pt', marginBottom: '8pt', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'block' }}>
                  <h1 style={{ fontSize: '18pt', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Inventory Handover</h1>
                  <p style={{ margin: '1pt 0 0', fontWeight: '700', fontSize: '9pt', opacity: 0.7 }}>TECNO Asset Management</p>
                </div>
                <div style={{ textAlign: 'right', display: 'block' }}>
                  <p style={{ margin: 0, fontWeight: '900', fontSize: '11pt', color: '#1e40af' }}>ID: {invoiceData.invoiceId}</p>
                  <p style={{ margin: '1pt 0 0', opacity: 0.7, fontSize: '8pt', fontWeight: '700' }}>{invoiceData.date}</p>
                </div>
              </div>

              <div style={{ marginBottom: '10pt', display: 'flex' }}>
                <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '10pt', borderRadius: '8pt', border: '0.5pt solid #cbd5e1', display: 'block' }}>
                  <p style={{ margin: '0 0 2pt', textTransform: 'uppercase', fontSize: '7pt', fontWeight: '900', color: '#64748b', letterSpacing: '0.5px' }}>Recipient Details</p>
                  <p style={{ margin: 0, fontSize: '11pt', fontWeight: '900', color: '#0f172a' }}>{invoiceData.borrowerName}</p>
                  <p style={{ margin: '1pt 0 0', fontSize: '9pt', fontWeight: '700', color: '#475569' }}>{invoiceData.department}</p>
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
                  {invoiceData.phones.map((p: Phone, i: number) => (
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
                  ))}
                </tbody>
              </table>

              <div style={{ marginBottom: '15pt', display: 'flex', justifyContent: 'flex-end', paddingRight: '6pt' }}>
                <div style={{ textAlign: 'right', display: 'block' }}>
                  <p style={{ margin: '0 0 2pt', textTransform: 'uppercase', fontSize: '7pt', fontWeight: '900', color: '#64748b', letterSpacing: '1px' }}>Total Asset Valuation</p>
                  <p style={{ margin: 0, fontSize: '22pt', fontWeight: '900', color: '#1e40af', borderBottom: '4pt solid #1e40af', display: 'inline-block', paddingBottom: '2pt', letterSpacing: '-1px' }}>
                    ${invoiceData.phones.reduce((s: number, p: Phone) => s + (p.price || 0), 0).toLocaleString()}
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
                    <p style={{ margin: '1pt 0 0', fontSize: '7.5pt', opacity: 0.5, fontWeight: '700' }}>{invoiceData.borrowerName}</p>
                  </div>
                  <div style={{ width: '180pt', textAlign: 'center', display: 'block' }}>
                    <div style={{ borderBottom: '1.5px solid black', marginBottom: '6pt', height: '30pt' }}></div>
                    <p style={{ margin: 0, fontWeight: '900', fontSize: '8.5pt', textTransform: 'uppercase' }}>Giver Signature</p>
                    <p style={{ margin: '1pt 0 0', fontSize: '7.5pt', opacity: 0.5, fontWeight: '700' }}>Infrastructure Control</p>
                  </div>
                </div>
              </div>
           </div>
        )}
      </div>

      {/* Upper Status Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-6 shadow-xl shadow-slate-200">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="p-3 lg:p-4 bg-white/10 rounded-2xl lg:rounded-3xl backdrop-blur-md">
              <HardDrive size={24} className="lg:w-8 lg:h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg lg:text-2xl font-black">Local File Engine</h3>
              <p className="text-slate-400 text-xs lg:text-sm font-medium mt-1">
                {storageMode === 'file' ? 'Direct Hardware Access' : 'Browser Session Cache'}
              </p>
            </div>
          </div>
          <div className="flex items-center bg-4 lg:-white/10 pxpx-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl border border-white/10">
            <Activity size={16} className="lg:w-[18px] text-green-400 mr-2 lg:mr-3 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Core Status: Stable</span>
          </div>
        </div>
        
        <div className="lg:col-span-4 bg-white rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Operational Health</p>
            <h4 className="text-3xl lg:text-4xl font-black text-slate-900">{stats.health}%</h4>
            <p className="text-[10px] text-green-600 font-black mt-1 uppercase tracking-tighter">Ready for Deployment</p>
          </div>
          <div className="w-12 lg:w-16 h-12 lg:h-16 bg-green-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-green-600">
            <TrendingUp size={24} className="lg:w-8 lg:h-8" />
          </div>
        </div>
      </div>

      {/* Stats Layer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {[
          { label: 'Total Inventory', value: stats.total, icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Handover', value: stats.onBorrow, icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Available Units', value: stats.available, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Asset Alert', value: stats.broken, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 lg:p-8 rounded-2xl lg:rounded-[2rem] shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1">
            <div className={`w-10 lg:w-12 h-10 lg:h-12 rounded-xl lg:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 lg:mb-6`}>
              <stat.icon size={20} className="lg:w-6 lg:h-6" />
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
        {/* Charts Layer */}
        <div className="lg:col-span-8 space-y-4 lg:space-y-8">
          <div className="bg-white p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest flex items-center mb-6 lg:mb-10">
              <TrendingUp className="mr-3 text-blue-600" size={16} />
              Model Distribution
            </h3>
            <div className="h-56 lg:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Integrity Table */}
          <div className="bg-white rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 lg:p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Active Device Handover</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] text-slate-400 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-4 lg:px-8 py-3 lg:py-4">Hardware Item</th>
                    <th className="px-4 lg:px-8 py-3 lg:py-4">Personnel</th>
                    <th className="px-4 lg:px-8 py-3 lg:py-4 text-right">Date</th>
                    <th className="px-4 lg:px-8 py-3 lg:py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold">
                  {phones.filter(p => p.status === DeviceStatus.ON_BORROW).slice(0, 5).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 lg:px-8 py-3 lg:py-4 text-slate-900">{p.brand} {p.model}</td>
                      <td className="px-4 lg:px-8 py-3 lg:py-4">
                        <div className="flex items-center text-blue-600">
                          <User size={12} className="mr-2" /> {p.borrower?.name}
                        </div>
                      </td>
                      <td className="px-4 lg:px-8 py-3 lg:py-4 text-right text-slate-400">{p.borrower?.date}</td>
                      <td className="px-4 lg:px-8 py-3 lg:py-4 text-right">
                        <button 
                          onClick={() => setInvoiceData({
                            invoiceId: `INV-${p.id.slice(0,6).toUpperCase()}`,
                            date: p.borrower?.date || new Date().toLocaleDateString(),
                            borrowerName: p.borrower?.name || 'N/A',
                            department: p.borrower?.department || 'N/A',
                            phones: [p]
                          })}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Download Invoice"
                        >
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Layer: Activity Log */}
        <div className="lg:col-span-4 space-y-4 lg:space-y-8">
           <div className="bg-white p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full">
            <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest flex items-center mb-6 lg:mb-8">
              <History className="mr-3 text-indigo-600" size={16} />
              System Audit Trail
            </h3>
            <div className="flex-1 space-y-4 lg:space-y-6 overflow-y-auto max-h-[400px] lg:max-h-[600px] pr-2">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="flex gap-3 lg:gap-4 group animate-in slide-in-from-right-2">
                  <div className="mt-1 p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                    {getLogIcon(log.action)}
                  </div>
                  <div className="flex-1 border-b border-slate-50 pb-3 lg:pb-4">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-slate-900">{log.action}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">{log.details}</p>
                    <p className="text-[9px] font-black text-blue-600 mt-2 uppercase tracking-tighter">Op: {log.user}</p>
                  </div>
                </div>
              )) : (
                <div className="py-12 lg:py-20 text-center opacity-20">
                  <Activity size={32} className="lg:w-10 lg:h-10 mx-auto mb-3 lg:mb-4" />
                  <p className="text-[10px] font-black uppercase">No Activity Logged</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
