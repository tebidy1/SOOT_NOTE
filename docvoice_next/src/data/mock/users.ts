import { User } from '@/types';

// Using static data to prevent hydration errors from random generation.
export const clients: User[] = [
  { id: 'admin-user-01', uid: 'admin-user-01-uid', name: 'Admin User', email: 'admin@aramex.com', role: 'Admin', createdAt: new Date('2023-01-15T09:00:00Z'), photoURL: 'https://i.pravatar.cc/150?u=admin-user-01' },
  { id: 'admin-user-02', uid: 'admin-user-02-uid', name: 'Supervisor Sam', email: 'admin@example.com', role: 'Admin', createdAt: new Date('2023-02-20T09:00:00Z'), photoURL: 'https://i.pravatar.cc/150?u=admin-user-02' },
  { id: 'admin-user-03', uid: 'admin-user-03-uid', name: 'Manager Mary', email: 'admin123@test.com', role: 'Admin', createdAt: new Date('2023-03-25T09:00:00Z'), photoURL: 'https://i.pravatar.cc/150?u=admin-user-03' },
  
  { id: 'courier-user-01', uid: 'courier-user-01-uid', name: 'Dave the Driver', email: 'driver@aramex.com', role: 'Courier', createdAt: new Date('2023-04-10T09:00:00Z'), photoURL: 'https://i.pravatar.cc/150?u=courier-user-01', status: 'active', rating: 4.8, totalDeliveries: 213 },
  { id: 'courier-user-02', uid: 'courier-user-02-uid', name: 'Racer Rick', email: 'driver123@test.com', role: 'Courier', createdAt: new Date('2023-05-12T09:00:00Z'), photoURL: 'https://i.pravatar.cc/150?u=courier-user-02', status: 'inactive', rating: 4.6, totalDeliveries: 154 },
  { id: 'courier-user-03', uid: 'courier-user-03-uid', name: 'Speedy Gonzales', email: 'courier.speedy@example.com', role: 'Courier', createdAt: new Date('2023-06-15T09:00:00Z'), photoURL: 'https://i.pravatar.cc/150?u=courier-user-03', status: 'busy', rating: 4.9, totalDeliveries: 301 },
  
  { id: 'customer-user-01', uid: 'customer-user-01-uid', name: 'Customer Carla', email: 'user@example.com', role: 'Customer', createdAt: new Date('2023-07-01T09:00:00Z'), photoURL: 'https://i.pravatar.cc/150?u=customer-user-01' },
  { id: 'customer-user-02', uid: 'customer-user-02-uid', name: 'Client Chris', email: 'customer@test.com', role: 'Customer', createdAt: new Date('2023-08-05T09:00:00Z'), photoURL: 'https://i.pravatar.cc/150?u=customer-user-02' },
];


export const couriers: User[] = clients.filter(user => user.role === 'Courier');
export const customers: User[] = clients.filter(user => user.role === 'Customer');
export const admins: User[] = clients.filter(user => user.role === 'Admin');
