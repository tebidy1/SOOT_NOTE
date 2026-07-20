export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: string;
  company_id?: string;
  createdAt: any; // Can be a Timestamp
  phone?: string;
  photoURL?: string;
  // Courier specific
  status?: 'active' | 'inactive' | 'busy';
  rating?: number;
  totalDeliveries?: number;
  notifications?: {
    sms: boolean;
    email: boolean;
  };
}

export type ShipmentStatusAPI = 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatusAPI;
  origin: string;
  destination: string;
  cost: number;
  userId: string;
  createdAt: any;
  updatedAt?: any;
}
