
import React, { useState } from 'react';
import { Smartphone, Lock, Mail, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { AdminUser } from '../types';

interface AuthProps {
  onLogin: (user: AdminUser) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Artificial delay for premium feel
    setTimeout(() => {
      if (formData.username.toLowerCase() === 'admin' && formData.password === '1234') {
        onLogin({
          id: '1',
          name: 'System Administrator',
          email: 'admin@local',
          department: 'IT Infrastructure'
        });
      } else {
        setError("Invalid credentials. Please use the system default.");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm">
          <div className="p-10">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20 mb-4 rotate-3">
                <Smartphone size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">TEC-Know</h1>
              <div className="flex items-center mt-1 space-x-2">
                <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Internal Secure Portal</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl mb-8 border border-blue-100 dark:border-blue-800/50">
               <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold text-center">
                 This is a restricted company terminal. <br/>Enter master credentials to gain access.
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    required
                    type="text"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white dark:placeholder:text-slate-400"
                    placeholder="Enter Admin"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Pin</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    required
                    type="password"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white dark:placeholder:text-slate-400"
                    placeholder="Enter 1234"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-4 rounded-xl text-sm font-bold border border-red-100 dark:border-red-800/50 animate-in shake duration-300">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-4 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-black rounded-xl shadow-xl shadow-slate-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Authorize Connection
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Company Protected Asset V3.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
