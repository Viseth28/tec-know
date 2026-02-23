
import React, { useMemo } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { Phone, DeviceStatus, DeviceCondition, ActivityEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dbService } from '../services/db';

interface DashboardProps {
  phones: Phone[];
  logs: ActivityEntry[];
}

export const Dashboard: React.FC<DashboardProps> = ({ phones, logs }) => {
  const storageMode = dbService.getMode();

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

  const modelData = useMemo(() => 
    Object.entries(
      phones.reduce((acc: Record<string, number>, p) => {
        acc[p.model] = (acc[p.model] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value),
  [phones]);

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
      {/* Upper Status Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-slate-200">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
              <HardDrive size={32} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Local File Engine</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">
                {storageMode === 'file' ? 'Direct Hardware Access' : 'Browser Session Cache'}
              </p>
            </div>
          </div>
          <div className="flex items-center bg-white/10 px-6 py-3 rounded-2xl border border-white/10">
            <Activity size={18} className="text-green-400 mr-3 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Core Status: Stable</span>
          </div>
        </div>
        
        <div className="lg:col-span-4 bg-white rounded-[2rem] p-8 border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Operational Health</p>
            <h4 className="text-4xl font-black text-slate-900">{stats.health}%</h4>
            <p className="text-[10px] text-green-600 font-black mt-1 uppercase tracking-tighter">Ready for Deployment</p>
          </div>
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <TrendingUp size={32} />
          </div>
        </div>
      </div>

      {/* Stats Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Inventory', value: stats.total, icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Handover', value: stats.onBorrow, icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Available Units', value: stats.available, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Asset Alert', value: stats.broken, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Charts Layer */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest flex items-center mb-10">
              <TrendingUp className="mr-3 text-blue-600" size={16} />
              Model Distribution
            </h3>
            <div className="h-72">
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
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Active Device Handover</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[9px] text-slate-400 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Hardware Item</th>
                    <th className="px-8 py-4">Personnel</th>
                    <th className="px-8 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold">
                  {phones.filter(p => p.status === DeviceStatus.ON_BORROW).slice(0, 5).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 text-slate-900">{p.brand} {p.model}</td>
                      <td className="px-8 py-4">
                        <div className="flex items-center text-blue-600">
                          <User size={12} className="mr-2" /> {p.borrower?.name}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right text-slate-400">{p.borrower?.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Layer: Activity Log */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full">
            <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest flex items-center mb-8">
              <History className="mr-3 text-indigo-600" size={16} />
              System Audit Trail
            </h3>
            <div className="flex-1 space-y-6 overflow-y-auto max-h-[600px] pr-2">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="flex gap-4 group animate-in slide-in-from-right-2">
                  <div className="mt-1 p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                    {getLogIcon(log.action)}
                  </div>
                  <div className="flex-1 border-b border-slate-50 pb-4">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-slate-900">{log.action}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">{log.details}</p>
                    <p className="text-[9px] font-black text-blue-600 mt-2 uppercase tracking-tighter">Op: {log.user}</p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center opacity-20">
                  <Activity size={40} className="mx-auto mb-4" />
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
