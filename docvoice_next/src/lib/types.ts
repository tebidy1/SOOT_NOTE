export type ShipmentStatus = 'Processing' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Delayed' | 'On Hold';

export type Shipment = {
  id: string;
  trackingNumber: string;
  carrier: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  updatedAt: string;
};

export interface Address {
  id: string;
  nickname: string;
  recipient: string;
  address: string;
  state: string;
  locality: string;
  phone: string;
  isDefault: boolean;
  createdAt?: any;
  updatedAt?: any;
}


export interface User {
  id: string; // Firestore document ID
  uid?: string; // Firebase Auth ID
  name: string;
  email: string;
  role: "Admin" | "Courier" | "Customer";
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

export interface ShipmentAPI {
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


// Geographical Hierarchy Types
export interface State {
    id: string;
    name: string;
    code: string;
    country: string;
}

export interface District {
    id: string;
    name: string;
    stateId: string;
    stateName?: string;
}

export interface City {
    id: string;
    name: string;
    districtId: string;
    districtName?: string;
}

export interface Neighborhood {
    id: string;
    name: string;
    cityId: string;
    cityName?: string;
}

// Chart of Accounts Types
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
    id: string;
    code: string;
    name: string;
    nameEn?: string;
    name_en?: string;
    type: AccountType;
    isPostable: boolean;
    is_postable?: boolean;
    level: number;
    parentId: string | null;
    parent_id?: string | null;
    balance?: number;
    children?: Account[];
}
