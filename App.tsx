
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-white text-gray-900 p-12 print:p-0">
        <div class="max-w-3xl mx-auto bg-white">
          <div class="flex justify-between items-start mb-12">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">T</div>
                <h1 class="text-2xl font-bold tracking-tight">Tec-Know</h1>
              </div>
              <p class="text-gray-500 text-sm">Device Management System</p>
            </div>
            <div class="text-right">
              <h2 class="text-4xl font-light text-gray-200 uppercase tracking-widest mb-2">Invoice</h2>
              <p class="text-sm font-medium text-gray-900">#${log.id.slice(0, 8).toUpperCase()}</p>
              <p class="text-sm text-gray-500">${new Date(log.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Transaction Details</h3>
              <div class="space-y-3">
                <div>
                  <p class="text-xs text-gray-500">Action Type</p>
                  <p class="font-medium capitalize text-gray-900">${log.action}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Processed By</p>
                  <p class="font-medium text-gray-900">${log.user}</p>
                </div>
                 <div>
                  <p class="text-xs text-gray-500">Time</p>
                  <p class="font-medium text-gray-900">${new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Device Info</h3>
              <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p class="text-xs text-gray-500 mb-1">Model</p>
                <p class="font-semibold text-gray-900 text-lg">${(log as any).phoneModel || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div class="mb-12">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Description & Notes</h3>
            <div class="p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
              <p class="text-gray-600 leading-relaxed text-sm">${typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}</p>
            </div>
          </div>

          <div class="pt-12 border-t border-gray-100">
            <div class="flex justify-between items-end">
              <div class="text-xs text-gray-400">
                <p>Authorized electronically</p>
                <p>Tec-Know System Generated</p>
              </div>
              <div class="text-right">
                 <div class="h-12 w-32 border-b border-gray-300 mb-2"></div>
                 <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signature</p>
              </div>
            </div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderCheck size={32} />
          </div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Storage</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Please authorize access to <b>{activeFileName || 'your data folder'}</b> to sync the database.
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={handleVerifyFile}
              className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-gray-900/20"
            >
              <RefreshCw size={18} />
              Authorize Access
            </button>
            <button 
              onClick={() => { dbService.setMode('local_storage'); setNeedsFileVerify(false); fetchData(); }}
              className="w-full py-3.5 bg-white text-gray-500 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-[0.98]"
            >
              Use Local Cache
            </button>
          </div>
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-400 font-medium text-sm tracking-wide animate-pulse">Loading System...</p>
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
