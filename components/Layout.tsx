
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Smartphone, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings as SettingsIcon,
  Menu,
  X,
  HardDrive,
  RefreshCw,
  LogOut,
  Database
} from 'lucide-react';
import { ViewType, AdminUser } from '../types';
import { dbService } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  syncStatus?: 'synced' | 'syncing' | 'error';
  currentUser: AdminUser | null;
  onLogout: () => void;
  activeFileName?: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  syncStatus = 'synced',
  currentUser,
  onLogout,
  activeFileName
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const mode = dbService.getMode();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', path: '/inventory', label: 'Inventory', icon: Smartphone },
    { id: 'register', path: '/register', label: 'Register Phone', icon: PlusCircle },
    { id: 'borrow', path: '/borrow', label: 'Borrow Phone', icon: ArrowUpRight },
    { id: 'return', path: '/return', label: 'Return Phone', icon: ArrowDownLeft },
    { id: 'settings', path: '/settings', label: 'System Setting', icon: SettingsIcon },
  ];

  const getSyncIndicator = () => {
    if (syncStatus === 'syncing') {
      return (
        <div className="flex items-center text-blue-500 text-[10px] font-black bg-blue-50 px-3 py-2 rounded-full border border-blue-100 animate-pulse">
          <RefreshCw size={12} className="mr-2 animate-spin" /> SAVING TO DISK...
        </div>
      );
    }
    
    if (mode === 'file') {
      return (
        <div className="flex items-center text-slate-900 text-[10px] font-black bg-slate-100 px-3 py-2 rounded-full border border-slate-200">
          <HardDrive size={12} className="mr-2 text-blue-600" /> 
          LOCAL FILE: {activeFileName?.toUpperCase() || 'DB.JSON'}
        </div>
      );
    }

    return (
      <div className="flex items-center text-green-600 text-[10px] font-black bg-green-50 px-3 py-2 rounded-full border border-green-100">
        <Database size={12} className="mr-2" /> BROWSER MEMORY (FREE)
      </div>
    );
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl relative z-50`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3 truncate animate-in slide-in-from-left-2 duration-300">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 rotate-3">
                <Smartphone size={20} />
              </div>
              <span className="font-black text-xl tracking-tight">TEC-Know</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `w-full flex items-center p-3.5 rounded-xl transition-all duration-200 group ${
                isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={22} className={'group-hover:scale-110 transition-transform'} />
              {isSidebarOpen && <span className="ml-3.5 font-bold text-sm tracking-wide">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest font-black text-center">
          {isSidebarOpen && <p>© 2024 TEC-Know</p>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50 flex flex-col">
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 px-8 py-4 flex justify-between items-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 capitalize flex items-center tracking-tight">
            {(() => {
              const match = menuItems.find(mi => mi.path === location.pathname);
              return match ? match.label : location.pathname.replace(/\//g, ' ').trim() || 'Dashboard';
            })()}
          </h1>
          
          <div className="flex items-center space-x-6">
            {getSyncIndicator()}
            <div className="flex items-center space-x-4 border-l pl-6 border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none">{currentUser?.name || 'Guest User'}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{currentUser?.department || 'Visitor'}</p>
              </div>
              
              <div className="group relative">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl w-10 h-10 flex items-center justify-center text-white font-black shadow-xl shadow-blue-200 cursor-pointer hover:scale-105 transition-transform text-xs">
                  {getUserInitials(currentUser?.name || 'Admin User')}
                </div>
                
                <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
                  >
                    <LogOut size={18} className="mr-3" />
                    Logout Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
