
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { RegisterPhone } from './components/RegisterPhone';
import { BorrowPhone } from './components/BorrowPhone';
import { ReturnPhone } from './components/ReturnPhone';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { ViewType, Phone, CustomFieldDefinition, AdminUser, ActivityEntry } from './types';
import { dbService } from './services/db';
import { FolderCheck, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsFileVerify, setNeedsFileVerify] = useState(false);
  const [activeFileName, setActiveFileName] = useState<string | null>(localStorage.getItem('active_file_name'));
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const navigate = useNavigate();
  const [selectedPhoneForBorrow, setSelectedPhoneForBorrow] = useState<Phone | null>(null);
  const [selectedPhoneForReturn, setSelectedPhoneForReturn] = useState<Phone | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [phonesData, fieldsData, logsData] = await Promise.all([
        dbService.getPhones(),
        dbService.getCustomFieldDefinitions(),
        dbService.getLogs()
      ]);
      setPhones(phonesData);
      setCustomFields(fieldsData);
      setLogs(logsData);
    } catch (err) {
      console.error("Data sync failure", err);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const savedSession = localStorage.getItem('admin_session');
      if (savedSession) setCurrentUser(JSON.parse(savedSession));

      const mode = dbService.getMode();
      if (mode === 'file') {
        setNeedsFileVerify(true);
      } else {
        await fetchData();
      }
    };
    init();
  }, [fetchData]);

  const handleVerifyFile = async () => {
    try {
      const newName = await dbService.connectLocalFolder();
      setActiveFileName(newName);
      localStorage.setItem('active_file_name', newName);
      setNeedsFileVerify(false);
      await fetchData();
    } catch (e) {
      // User cancelled picker
    }
  };

  const addPhone = async (newPhone: Phone) => {
    setSyncStatus('syncing');
    setPhones(prev => [...prev, newPhone]);
    await dbService.savePhone(newPhone, currentUser?.name || 'System');
    setSyncStatus('synced');
    await fetchData(); 
  };

  const updatePhone = async (updatedPhone: Phone) => {
    setSyncStatus('syncing');
    setPhones(prev => prev.map(p => p.id === updatedPhone.id ? updatedPhone : p));
    await dbService.savePhone(updatedPhone, currentUser?.name || 'System');
    setSyncStatus('synced');
    await fetchData(); 
  };

  const updatePhonesBatch = async (updatedPhones: Phone[]) => {
    setSyncStatus('syncing');
    setPhones(prev => {
      const updated = [...prev];
      for (const phone of updatedPhones) {
        const idx = updated.findIndex(p => p.id === phone.id);
        if (idx >= 0) updated[idx] = phone;
      }
      return updated;
    });
    for (const phone of updatedPhones) {
      await dbService.savePhone(phone, currentUser?.name || 'System');
    }
    setSyncStatus('synced');
    await fetchData(); 
  };

  const deletePhone = async (id: string) => {
    setSyncStatus('syncing');
    setPhones(prev => prev.filter(p => p.id !== id));
    await dbService.deletePhone(id, currentUser?.name || 'System');
    setSyncStatus('synced');
    await fetchData(); 
  };

  const updateCustomFields = async (newFields: CustomFieldDefinition[]) => {
    setSyncStatus('syncing');
    setCustomFields(newFields);
    await dbService.saveCustomFieldDefinitions(newFields, currentUser?.name || 'System');
    setSyncStatus('synced');
    await fetchData(); 
  };

  if (!currentUser && !isLoading) {
    return <Auth onLogin={(user) => {
      setCurrentUser(user);
      localStorage.setItem('admin_session', JSON.stringify(user));
      setCurrentView('dashboard');
    }} />;
  }

  if (needsFileVerify) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 shadow-2xl animate-in zoom-in-95">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/10">
            <FolderCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Folder Authorization</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            The system needs permission to access the data folder <b>{activeFileName || 'your storage directory'}</b> to manage <b>db.json</b> and its mirror.
          </p>
          <button 
            onClick={handleVerifyFile}
            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <RefreshCw size={20} />
            Authorize Folder Access
          </button>
          <button 
            onClick={() => { dbService.setMode('local_storage'); setNeedsFileVerify(false); fetchData(); }}
            className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600"
          >
            Switch to Browser Cache (Unmirrored)
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      syncStatus={syncStatus}
      currentUser={currentUser}
      onLogout={() => { setCurrentUser(null); localStorage.removeItem('admin_session'); }}
      activeFileName={activeFileName}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Engine...</p>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard phones={phones} logs={logs} />} />
          <Route path="/inventory" element={<Inventory phones={phones} onUpdate={updatePhone} onDelete={deletePhone} customFieldDefinitions={customFields} onNavigateToBorrow={(p) => { setSelectedPhoneForBorrow(p); navigate('/borrow'); }} onNavigateToReturn={(p) => { setSelectedPhoneForReturn(p); navigate('/return'); }} />} />
          <Route path="/register" element={<RegisterPhone onAdd={addPhone} lastIndex={phones.length} customFieldDefinitions={customFields} />} />
          <Route path="/borrow" element={<BorrowPhone phones={phones} onUpdate={updatePhone} onBatchUpdate={updatePhonesBatch} initialPhone={selectedPhoneForBorrow} />} />
          <Route path="/return" element={<ReturnPhone phones={phones} onUpdate={updatePhone} onBatchUpdate={updatePhonesBatch} initialPhone={selectedPhoneForReturn} />} />
          <Route path="/settings" element={<Settings customFields={customFields} onUpdateCustomFields={updateCustomFields} onStorageChange={fetchData} />} />
        </Routes>
      )}
    </Layout>
  );
};

export default App;
