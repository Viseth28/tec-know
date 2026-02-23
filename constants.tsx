
import { Phone, DeviceCondition, DeviceStatus, Department } from './types';

export const INITIAL_PHONES: Phone[] = [
  {
    id: '1',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    price: 999,
    imei1: '358123456789012',
    imei2: '358123456789013',
    condition: DeviceCondition.NEW,
    status: DeviceStatus.AVAILABLE,
    lastUpdate: '2024-03-20',
  },
  {
    id: '2',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    price: 1199,
    imei1: '359123456789012',
    imei2: '359123456789013',
    condition: DeviceCondition.USED,
    status: DeviceStatus.ON_BORROW,
    lastUpdate: '2024-03-18',
    borrower: {
      name: 'John Doe',
      department: 'Marketing',
      date: '2024-03-18'
    }
  },
  {
    id: '3',
    brand: 'Google',
    model: 'Pixel 8 Pro',
    price: 899,
    imei1: '360123456789012',
    imei2: '360123456789013',
    condition: DeviceCondition.BROKEN,
    status: DeviceStatus.AVAILABLE,
    lastUpdate: '2024-03-15',
  }
];

export const DEPARTMENTS: Department[] = [
  { id: '1', name: 'Engineering' },
  { id: '2', name: 'Marketing' },
  { id: '3', name: 'Sales' },
  { id: '4', name: 'Human Resources' },
  { id: '5', name: 'Finance' },
  { id: '6', name: 'Customer Support' }
];
