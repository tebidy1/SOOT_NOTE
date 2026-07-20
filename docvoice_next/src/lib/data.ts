import type { Shipment } from '@/lib/types';
import type { ManagedItem } from '@/components/file-manager/types';
import { subDays, format } from 'date-fns';

const now = new Date();

export const shipments: Shipment[] = [
  {
    id: '1',
    trackingNumber: '1Z999AA10123456784',
    carrier: 'UPS',
    origin: 'San Francisco, CA',
    destination: 'New York, NY',
    status: 'In Transit',
    estimatedDelivery: format(subDays(now, -3), 'MMM d, yyyy'),
    updatedAt: format(subDays(now, 1), "h:mm a")
  },
  {
    id: '2',
    trackingNumber: '9400111202555843349451',
    carrier: 'USPS',
    origin: 'Miami, FL',
    destination: 'Seattle, WA',
    status: 'Delivered',
    estimatedDelivery: format(subDays(now, 5), 'MMM d, yyyy'),
    updatedAt: format(subDays(now, 5), "h:mm a")
  },
  {
    id: '3',
    trackingNumber: '783463999912',
    carrier: 'FedEx',
    origin: 'Chicago, IL',
    destination: 'Los Angeles, CA',
    status: 'Out for Delivery',
    estimatedDelivery: format(now, 'MMM d, yyyy'),
    updatedAt: format(now, "h:mm a")
  },
  {
    id: '4',
    trackingNumber: '1Z999AA101234569999',
    carrier: 'UPS',
    origin: 'Austin, TX',
    destination: 'Boston, MA',
    status: 'Delayed',
    estimatedDelivery: format(subDays(now, -1), 'MMM d, yyyy'),
    updatedAt: format(subDays(now, 1), "h:mm a")
  },
  {
    id: '5',
    trackingNumber: 'TBA09876543210',
    carrier: 'Amazon',
    origin: 'Warehouse A',
    destination: 'Denver, CO',
    status: 'Processing',
    estimatedDelivery: format(subDays(now, -2), 'MMM d, yyyy'),
    updatedAt: format(subDays(now, 0), "h:mm a")
  },
  {
    id: '6',
    trackingNumber: '9405511202555843349123',
    carrier: 'USPS',
    origin: 'Portland, OR',
    destination: 'Atlanta, GA',
    status: 'On Hold',
    estimatedDelivery: format(subDays(now, -4), 'MMM d, yyyy'),
    updatedAt: format(subDays(now, 2), "h:mm a")
  },
  {
    id: '7',
    trackingNumber: '783463999915',
    carrier: 'FedEx',
    origin: 'Newark, NJ',
    destination: 'Houston, TX',
    status: 'Delivered',
    estimatedDelivery: format(subDays(now, 10), 'MMM d, yyyy'),
    updatedAt: format(subDays(now, 10), "h:mm a")
  },
];

export const initialManagedItems: ManagedItem[] = [
  { id: 'f1', name: 'التسويق', parentId: null, createdAt: subDays(now, 10).toISOString(), itemType: 'folder' },
  { id: 'f2', name: 'المالية', parentId: null, createdAt: subDays(now, 15).toISOString(), itemType: 'folder' },
  { id: 'f3', name: 'أصول الهوية', parentId: 'f1', createdAt: subDays(now, 5).toISOString(), itemType: 'folder' },
  { id: 'f4', name: 'وسائل التواصل', parentId: 'f1', createdAt: subDays(now, 2).toISOString(), itemType: 'folder' },
  { 
    id: 'i1', 
    name: 'التقرير_السنوي_2023.pdf', 
    parentId: 'f2', 
    createdAt: subDays(now, 1).toISOString(), 
    itemType: 'file', 
    size: 2450000, 
    mimeType: 'application/pdf', 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' 
  },
  { 
    id: 'i2', 
    name: 'الشعار_الرئيسي.png', 
    parentId: 'f3', 
    createdAt: subDays(now, 4).toISOString(), 
    itemType: 'file', 
    size: 1200000, 
    mimeType: 'image/png', 
    url: 'https://picsum.photos/seed/aramex-logo/800/600' 
  },
  { 
    id: 'i3', 
    name: 'فيديو_ترويجي.mp4', 
    parentId: 'f4', 
    createdAt: subDays(now, 3).toISOString(), 
    itemType: 'file', 
    size: 45000000, 
    mimeType: 'video/mp4', 
    url: 'https://www.w3schools.com/html/mov_bbb.mp4' 
  },
  { 
    id: 'i4', 
    name: 'صورة_الفريق.jpg', 
    parentId: null, 
    createdAt: subDays(now, 7).toISOString(), 
    itemType: 'file', 
    size: 3500000, 
    mimeType: 'image/jpeg', 
    url: 'https://picsum.photos/seed/aramex-team/1200/800' 
  },
  { 
    id: 'i5', 
    name: 'مسودة_العقد.pdf', 
    parentId: null, 
    createdAt: subDays(now, 20).toISOString(), 
    itemType: 'file', 
    size: 45000, 
    mimeType: 'application/pdf', 
    url: 'https://raw.githubusercontent.com/firebase-studio/prototyping-shop-assets/main/mock-pdf.pdf' 
  },
];
