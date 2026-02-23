
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

  const fetchData = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);
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
      if (!background) setIsLoading(false);
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
    try {
      await dbService.savePhone(newPhone, currentUser?.name || 'System');
      setSyncStatus('synced');
    } catch (error) {
      console.error("Failed to add phone", error);
      setSyncStatus('error');
    }
    await fetchData(true); 
  };

  const updatePhone = async (updatedPhone: Phone) => {
    setSyncStatus('syncing');
    setPhones(prev => prev.map(p => p.id === updatedPhone.id ? updatedPhone : p));
    try {
      await dbService.savePhone(updatedPhone, currentUser?.name || 'System');
      setSyncStatus('synced');
    } catch (error) {
      console.error("Failed to update phone", error);
      setSyncStatus('error');
    }
    await fetchData(true); 
  };

  const updatePhonesBatch = async (updatedPhones: Phone[]) => {
    setSyncStatus('syncing');
    // Optimistic update
    setPhones(prev => {
      const updated = [...prev];
      for (const phone of updatedPhones) {
        const idx = updated.findIndex(p => p.id === phone.id);
        if (idx >= 0) updated[idx] = phone;
      }
      return updated;
    });

    try {
      const userName = currentUser?.name || 'System';
      // Parallelize save operations
      await Promise.all(updatedPhones.map(phone => dbService.savePhone(phone, userName)));
      setSyncStatus('synced');
    } catch (error) {
      console.error("Batch update failed", error);
      setSyncStatus('error');
    }
    await fetchData(true); 
  };

  const deletePhone = async (id: string) => {
    setSyncStatus('syncing');
    setPhones(prev => prev.filter(p => p.id !== id));
    try {
      await dbService.deletePhone(id, currentUser?.name || 'System');
      setSyncStatus('synced');
    } catch (error) {
      console.error("Failed to delete phone", error);
      setSyncStatus('error');
    }
    await fetchData(true); 
  };

  const handleDownloadInvoice = (log: ActivityEntry) => {
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${log.id}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="p-8 bg-white text-slate-900">
        <div class="max-w-2xl mx-auto border border-slate-200 rounded-lg p-8 shadow-sm">
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-2xl font-bold text-slate-900">INVOICE</h1>
              <p class="text-slate-500 text-sm">Transaction ID: ${log.id}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-lg">Tec-Know</p>
              <p class="text-slate-500 text-sm">${new Date(log.timestamp).toLocaleDateString()}</p>
            </div>
          </div>

          <div class="mb-8 p-6 bg-slate-50 rounded-lg">
            <h3 class="font-bold text-slate-700 mb-4 uppercase tracking-wider text-sm">Transaction Details</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-500 uppercase">Action</p>
                <p class="font-medium capitalize">${log.action}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase">Handled By</p>
                <p class="font-medium">${log.user}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase">Device</p>
                <p class="font-medium">${(log as any).phoneModel || 'N/A'}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase">Time</p>
                <p class="font-medium">${new Date(log.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          <div class="mb-8">
            <h3 class="font-bold text-slate-700 mb-2 uppercase tracking-wider text-sm">Description</h3>
            <div class="p-4 border border-slate-200 rounded bg-white">
              <p class="text-slate-600">${typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}</p>
            </div>
          </div>

          <div class="mt-12 pt-8 border-t border-slate-200 flex justify-between items-end">
            <div class="text-center">
              <div class="w-32 border-b border-slate-300 mb-2"></div>
              <p class="text-xs text-slate-400 uppercase">Authorized Signature</p>
            </div>
            <p class="text-xs text-slate-400">Generated automatically by Tec-Know System</p>
          </div>
        </div>
        <script>
          window.onload = () => { window.print(); }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
    }
  };

  const updateCustomFields = async (newFields: CustomFieldDefinition[]) => {
    setSyncStatus('syncing');
    setCustomFields(newFields);
    try {
      await dbService.saveCustomFieldDefinitions(newFields, currentUser?.name || 'System');
      setSyncStatus('synced');
    } catch (error) {
      console.error("Failed to update fields", error);
      setSyncStatus('error');
    }
    await fetchData(true); 
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
          <Route path="/dashboard" element={<Dashboard phones={phones} logs={logs} onDownloadInvoice={handleDownloadInvoice} />} />
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
