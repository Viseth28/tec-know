
import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Smartphone,
  Cloud,
  Globe,
  Plus,
  Trash2,
  Type as TypeIcon,
  Layers,
  FileJson,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FolderSync
} from 'lucide-react';
import { CustomFieldDefinition, StorageMode } from '../types';
import { dbService } from '../services/db';

interface SettingsProps {
  customFields?: CustomFieldDefinition[];
  onUpdateCustomFields?: (fields: CustomFieldDefinition[]) => void;
  onStorageChange?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  customFields = [], 
  onUpdateCustomFields,
  onStorageChange
}) => {
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date'>('text');
  const [storageMode, setStorageMode] = useState<StorageMode>(dbService.getMode());
  const [folderName, setFolderName] = useState<string | null>(localStorage.getItem('active_file_name'));
  const [error, setError] = useState<string | null>(null);

  const isSupported = dbService.isFileSystemSupported();
  const isSecure = dbService.isSecureContext();

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const newField: CustomFieldDefinition = {
      id: `field_${Date.now()}`,
      label: newFieldName.trim(),
      type: newFieldType
    };
    if (onUpdateCustomFields) {
      onUpdateCustomFields([...customFields, newField]);
    }
    setNewFieldName('');
  };

  const handleRemoveField = (id: string) => {
    if (onUpdateCustomFields) {
      onUpdateCustomFields(customFields.filter(f => f.id !== id));
    }
  };

  const switchStorage = (mode: StorageMode) => {
    if (mode === 'file') return;
    dbService.setMode(mode);
    setStorageMode(mode);
    if (onStorageChange) onStorageChange();
  };

  const handleConnectFolder = async () => {
    try {
      const name = await dbService.connectLocalFolder();
      setFolderName(name);
      localStorage.setItem('active_file_name', name);
      setStorageMode('file');
      if (onStorageChange) onStorageChange();
    } catch (e: any) {
      setError(e.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-16 lg:pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 lg:space-x-4">
          <div className="p-3 lg:p-4 bg-slate-900 text-white rounded-2xl lg:rounded-3xl shadow-xl shadow-slate-200">
            <SettingsIcon size={24} className="lg:w-7 lg:h-7" />
          </div>
          <div>
            <h2 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight">System Configuration</h2>
            <p className="text-slate-500 font-medium text-sm">Manage database architecture & mirroring protocol</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
          
          <div className="bg-white rounded-2xl lg:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="p-6 lg:px-10 lg:py-8 border-b border-gray-50 bg-gray-50/30">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase text-[10px] lg:text-xs tracking-widest flex items-center">
                  <Database size={16} className="mr-2 text-blue-600" />
                  Dual-File Mirroring Engine
                </h3>
              </div>
              <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
                Connect a folder to enable automatic mirroring between <b>db.json</b> and <b>.db.json</b>.
              </p>
            </div>
            
            <div className="p-6 lg:p-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-5 mb-6 lg:mb-10">
                <button 
                  onClick={() => switchStorage('local_storage')}
                  className={`p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border-2 transition-all flex flex-col items-center text-center space-y-2 lg:space-y-3 ${storageMode === 'local_storage' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-50 hover:border-gray-200 bg-gray-50/30'}`}
                >
                  <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl ${storageMode === 'local_storage' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-400 shadow-sm'}`}>
                    <Smartphone size={24} className="lg:w-7 lg:h-7" />
                  </div>
                  <span className={`font-black text-xs lg:text-sm tracking-tight ${storageMode === 'local_storage' ? 'text-blue-900' : 'text-gray-500'}`}>Browser Cache</span>
                </button>

                <div className={`p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border-2 transition-all flex flex-col items-center text-center space-y-2 lg:space-y-3 relative ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''} ${storageMode === 'file' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-50 bg-gray-50/30'}`}>
                  <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl ${storageMode === 'file' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-400 shadow-sm'}`}>
                    <FolderSync size={24} className="lg:w-7 lg:h-7" />
                  </div>
                  <span className={`font-black text-xs lg:text-sm tracking-tight ${storageMode === 'file' ? 'text-blue-900' : 'text-gray-500'}`}>Mirrored Folder</span>
                  {storageMode === 'file' && <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>}
                </div>

                <div className="p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border-2 border-dashed border-gray-100 bg-gray-50/20 opacity-50 flex flex-col items-center text-center space-y-2 lg:space-y-3 grayscale">
                  <div className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white text-gray-300">
                    <Cloud size={24} className="lg:w-7 lg:h-7" />
                  </div>
                  <span className="font-black text-xs lg:text-sm tracking-tight text-gray-400">Cloud Sync</span>
                </div>
              </div>

              {!isSupported ? (
                <div className="p-6 lg:p-8 bg-amber-50 border border-amber-200 rounded-2xl lg:rounded-[2rem] text-amber-900">
                  <div className="flex items-start space-x-3 lg:space-x-4">
                    <div className="p-2 lg:p-3 bg-white rounded-xl lg:rounded-2xl text-amber-500 shadow-sm">
                      <AlertTriangle size={20} className="lg:w-6 lg:h-6" />
                    </div>
                    <div>
                      <p className="font-black text-base lg:text-lg">Directory Access Not Supported</p>
                      <p className="text-xs lg:text-sm mt-1 leading-relaxed opacity-80">
                        Mirrored folder mode requires the <b>FileSystemDirectoryHandle</b> API.
                      </p>
                    </div>
                  </div>
                </div>
              ) : storageMode === 'file' ? (
                <div className="p-6 lg:p-8 bg-slate-900 rounded-2xl lg:rounded-[2rem] text-white animate-in zoom-in-95 duration-300 relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <ShieldCheck size={140} className="lg:w-[180px]" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 gap-4">
                      <div className="flex items-center space-x-3 lg:space-x-4">
                        <div className="p-2 lg:p-3 bg-white/10 rounded-xl lg:rounded-2xl backdrop-blur-md">
                          <HardDrive size={24} className="lg:w-8 lg:h-8 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-black text-lg lg:text-xl">Redundant Storage Active</p>
                          <p className="text-[10px] lg:text-xs font-bold text-blue-300 uppercase tracking-widest mt-1">Dir: {folderName || 'System Folder'}</p>
                        </div>
                      </div>
                      <div className="px-3 lg:px-4 py-1.5 lg:py-2 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20 flex items-center self-start sm:self-center">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        Safe Mirroring
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={handleConnectFolder}
                        className="py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all text-sm backdrop-blur-sm border border-white/5"
                      >
                        Select New Folder
                      </button>
                      <button 
                        onClick={() => switchStorage('local_storage')}
                        className="py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-2xl transition-all text-sm border border-red-500/10"
                      >
                        Disconnect Folder
                      </button>
                    </div>
                    <div className="mt-6 flex items-center text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] gap-4">
                      <span className="flex items-center"><div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div> db.json</span>
                      <span className="flex items-center"><div className="w-2 h-2 bg-slate-700 rounded-full mr-1"></div> .db.json (Mirror)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20">
                      <FolderSync size={44} className="text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="text-2xl font-black mb-2">Initialize Folder Mirror</h4>
                      <p className="text-blue-100 text-sm leading-relaxed mb-6">Connect a local folder to manage your database with automatic "hidden mirror" backups.</p>
                      <button 
                        onClick={handleConnectFolder}
                        className="px-12 py-4 bg-white text-blue-600 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl active:scale-95"
                      >
                        Choose Database Folder
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center">
                  <Layers size={16} className="mr-2 text-blue-600" />
                  Inventory Attributes
                </h3>
              </div>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm text-blue-500">
                        <TypeIcon size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{field.label}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">DataType: {field.type}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveField(field.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="e.g. Warranty ID"
                  className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                />
                <select 
                  className="sm:w-32 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-black text-xs text-slate-600"
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
                <button 
                  onClick={handleAddField}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all flex items-center justify-center shadow-lg shadow-slate-200"
                >
                  <Plus size={20} className="mr-2" />
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center">
              <Globe size={20} className="mr-2 text-blue-500" />
              Mirroring Health
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center">
                  <CheckCircle2 size={16} className="text-green-500 mr-2" />
                  <span className="text-xs font-bold text-slate-600">Primary Integrity</span>
                </div>
                <span className="text-[10px] font-black uppercase text-green-600">PASS</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center">
                  <CheckCircle2 size={16} className="text-green-500 mr-2" />
                  <span className="text-xs font-bold text-slate-600">Mirror Synchronization</span>
                </div>
                <span className="text-[10px] font-black uppercase text-green-600">READY</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <ExternalLink size={24} />
              </div>
            <h4 className="text-lg font-black mb-3">Redundancy Protocol</h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Mirroring creates a hidden <b>.db.json</b>. If the primary file is deleted or locked, the system auto-recovers from the mirror.
            </p>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Mirror Location</p>
              <p className="text-[11px] font-mono text-slate-300">./.db.json</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
