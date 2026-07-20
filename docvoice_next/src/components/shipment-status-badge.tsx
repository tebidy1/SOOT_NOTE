import type { ShipmentStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Truck, CheckCircle, Package, AlertTriangle, PauseCircle, Loader } from 'lucide-react';

type StatusInfo = {
  icon: React.ElementType;
  label: string;
  className: string;
};

const statusMap: Record<ShipmentStatus, StatusInfo> = {
  Processing: {
    icon: Loader,
    label: 'Processing',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
  'In Transit': {
    icon: Truck,
    label: 'In Transit',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  'Out for Delivery': {
    icon: Truck,
    label: 'Out for Delivery',
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
  },
  Delivered: {
    icon: CheckCircle,
    label: 'Delivered',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  Delayed: {
    icon: AlertTriangle,
    label: 'Delayed',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  },
  'On Hold': {
    icon: PauseCircle,
    label: 'On Hold',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  const { icon: Icon, label, className } = statusMap[status] || statusMap.Processing;

  return (
    <Badge
      variant="outline"
      className={cn('flex w-fit items-center gap-1.5 border-0 font-medium', className)}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "Processing" && "animate-spin")} />
      <span>{label}</span>
    </Badge>
  );
}
