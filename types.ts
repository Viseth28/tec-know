
export enum DeviceCondition {
  NEW = 'New',
  USED = 'Used',
  BROKEN = 'Broken'
}

export enum DeviceStatus {
  AVAILABLE = 'Available',
  ON_BORROW = 'On Borrow'
}

export type StorageMode = 'local_storage' | 'cloud' | 'file';

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date';
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  department: string;
}

export interface Phone {
  id: string;
  brand: string;
  model: string;
  price: number;
  imei1: string;
  imei2: string;
  condition: DeviceCondition;
  status: DeviceStatus;
  lastUpdate: string;
  customFields?: Record<string, any>;
  borrower?: {
    name: string;
    department: string;
    date: string;
  };
}

export interface Department {
  id: string;
  name: string;
}

export type ViewType = 'dashboard' | 'inventory' | 'register' | 'borrow' | 'return' | 'settings' | 'auth';
