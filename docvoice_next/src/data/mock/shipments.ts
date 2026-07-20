import { Shipment, ShipmentStatusAPI } from '@/types';
import { clients } from './users';

const customers = clients.filter(u => u.role === 'Customer');

// Static shipment data to prevent hydration errors and represent different stages
export const shipments: Shipment[] = [
    {
        id: 'shipment-001',
        trackingNumber: 'ARX-PENDING', // Easy to identify
        origin: 'Riyadh, SA',
        destination: 'Dubai, AE',
        status: 'pending',
        cost: 150.00,
        userId: customers[0]?.id || 'customer-user-01',
        createdAt: new Date('2023-10-20T18:45:00Z'),
        updatedAt: new Date('2023-10-20T18:45:00Z'),
    },
    {
        id: 'shipment-002',
        trackingNumber: 'ARX-TRANSIT', // Easy to identify
        origin: 'Jeddah, SA',
        destination: 'Cairo, EG',
        status: 'in_transit',
        cost: 220.50,
        userId: customers[1]?.id || 'customer-user-02',
        createdAt: new Date('2023-10-18T11:00:00Z'),
        updatedAt: new Date('2023-10-21T14:30:00Z'),
    },
    {
        id: 'shipment-003',
        trackingNumber: 'ARX-PICKEDUP', // Easy to identify
        origin: 'Dammam, SA',
        destination: 'Kuwait City, KW',
        status: 'picked_up', // This will be 'Out for Delivery' in UI
        cost: 85.75,
        userId: customers[0]?.id || 'customer-user-01',
        createdAt: new Date('2023-10-22T09:00:00Z'),
        updatedAt: new Date('2023-10-22T15:00:00Z'),
    },
    {
        id: 'shipment-004',
        trackingNumber: 'ARX-DELIVERED', // Easy to identify
        origin: 'Abu Dhabi, AE',
        destination: 'Manama, BH',
        status: 'delivered',
        cost: 95.00,
        userId: customers[1]?.id || 'customer-user-02',
        createdAt: new Date('2023-10-15T14:00:00Z'),
        updatedAt: new Date('2023-10-18T15:00:00Z'),
    },
];
