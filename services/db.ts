
import { Phone, CustomFieldDefinition, AdminUser, StorageMode, ActivityEntry } from '../types';
import { INITIAL_PHONES } from '../constants';

interface DBState {
  phones: Phone[];
  customFields: CustomFieldDefinition[];
  logs: ActivityEntry[];
}

let directoryHandle: FileSystemDirectoryHandle | null = null;
let writeQueue: Promise<void> = Promise.resolve();

const DB_FILENAME = 'db.json';
const MIRROR_FILENAME = '.db.json';

const LS_KEYS = {
  PHONES: 'tecknow_phones',
  FIELDS: 'tecknow_custom_fields',
  LOGS: 'tecknow_logs',
  MODE: 'tecknow_storage_mode'
};

export const dbService = {
  _getLS(): DBState {
    const phones = JSON.parse(localStorage.getItem(LS_KEYS.PHONES) || '[]');
    const fields = JSON.parse(localStorage.getItem(LS_KEYS.FIELDS) || '[]');
    const logs = JSON.parse(localStorage.getItem(LS_KEYS.LOGS) || '[]');
    return { 
      phones: phones.length ? phones : INITIAL_PHONES, 
      customFields: fields,
      logs: logs
    };
  },

  _saveLS(state: DBState) {
    localStorage.setItem(LS_KEYS.PHONES, JSON.stringify(state.phones));
    localStorage.setItem(LS_KEYS.FIELDS, JSON.stringify(state.customFields));
    localStorage.setItem(LS_KEYS.LOGS, JSON.stringify(state.logs));
  },

  async _readFile(): Promise<DBState> {
    if (!directoryHandle) return this._getLS();
    try {
      // Try reading main file first
      try {
        const fileHandle = await directoryHandle.getFileHandle(DB_FILENAME);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
      } catch (e) {
        console.warn("Main db.json not found or corrupted, trying mirror...");
        // Attempt recovery from mirror
        const mirrorHandle = await directoryHandle.getFileHandle(MIRROR_FILENAME);
        const file = await mirrorHandle.getFile();
        const text = await file.text();
        const state = JSON.parse(text);
        // Repair main file if mirror was successful
        await this._writeFile(state);
        return state;
      }
    } catch (e) {
      console.error("Critical read error in both files, falling back to browser cache", e);
      return this._getLS();
    }
  },

  async _writeFile(state: DBState) {
    writeQueue = writeQueue.then(async () => {
      if (!directoryHandle) {
        this._saveLS(state);
        return;
      }
      try {
        const data = JSON.stringify(state, null, 2);
        
        // 1. Write to Primary File
        const fileHandle = await directoryHandle.getFileHandle(DB_FILENAME, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();

        // 2. Write to Mirror Hidden File (.db.json)
        const mirrorHandle = await directoryHandle.getFileHandle(MIRROR_FILENAME, { create: true });
        const mirrorWritable = await mirrorHandle.createWritable();
        await mirrorWritable.write(data);
        await mirrorWritable.close();

      } catch (e) {
        console.error("Atomic mirrored write failed", e);
        this._saveLS(state);
      }
    });
    return writeQueue;
  },

  async _logAction(action: string, details: string, user: string) {
    const state = await this._readFile();
    const entry: ActivityEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      details,
      user
    };
    state.logs = [entry, ...state.logs].slice(0, 500); 
    await this._writeFile(state);
  },

  getMode(): StorageMode {
    return (localStorage.getItem(LS_KEYS.MODE) as StorageMode) || 'local_storage';
  },

  setMode(mode: StorageMode) {
    localStorage.setItem(LS_KEYS.MODE, mode);
  },

  isFileSystemSupported() {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  },

  isSecureContext() {
    return typeof window !== 'undefined' && window.isSecureContext;
  },

  async connectLocalFolder(): Promise<string> {
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite'
    });
    directoryHandle = handle;
    this.setMode('file');
    
    // Check if db.json exists, if not initialize it from current state
    try {
      await directoryHandle.getFileHandle(DB_FILENAME);
    } catch (e) {
      console.log("Initializing new folder database...");
      await this._writeFile(this._getLS());
    }
    
    return handle.name;
  },

  async getPhones(): Promise<Phone[]> {
    const state = await this._readFile();
    return state.phones;
  },

  async getLogs(): Promise<ActivityEntry[]> {
    const state = await this._readFile();
    return state.logs || [];
  },

  async savePhone(phone: Phone, user: string): Promise<void> {
    const state = await this._readFile();
    const index = state.phones.findIndex(p => p.id === phone.id);
    const action = index >= 0 ? 'UPDATE' : 'REGISTER';
    
    if (index >= 0) {
      state.phones[index] = phone;
    } else {
      state.phones.push(phone);
    }
    
    await this._writeFile(state);
    await this._logAction(action, `${phone.brand} ${phone.model} (${phone.imei1})`, user);
  },

  async deletePhone(id: string, user: string): Promise<void> {
    const state = await this._readFile();
    const phone = state.phones.find(p => p.id === id);
    state.phones = state.phones.filter(p => p.id !== id);
    await this._writeFile(state);
    if (phone) {
      await this._logAction('DELETE', `${phone.brand} ${phone.model} removed from database`, user);
    }
  },

  async getCustomFieldDefinitions(): Promise<CustomFieldDefinition[]> {
    const state = await this._readFile();
    return state.customFields;
  },

  async saveCustomFieldDefinitions(fields: CustomFieldDefinition[], user: string): Promise<void> {
    const state = await this._readFile();
    state.customFields = fields;
    await this._writeFile(state);
    await this._logAction('CONFIG', 'Metadata schema updated', user);
  },

  async loginAdmin(username: string, pin: string): Promise<AdminUser> {
    if (username.toLowerCase() === 'admin' && pin === '1234') {
      return {
        id: '1',
        name: 'System Administrator',
        email: 'admin@local',
        department: 'IT Infrastructure'
      };
    }
    throw new Error("Invalid credentials");
  }
};
