import type { Shipment } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ShipmentStatusBadge } from '@/components/shipment-status-badge';
import { ArrowRight, CalendarDays, Clock, Truck } from 'lucide-react';

const statusProgress: Record<Shipment['status'], number> = {
    Processing: 10,
    'In Transit': 40,
    'Out for Delivery': 75,
    Delivered: 100,
    Delayed: 50, // Or previous state's progress
    'On Hold': 50,
};


export function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const progressValue = statusProgress[shipment.status];
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-4">
            <div>
                <CardDescription className="font-medium">{shipment.carrier}</CardDescription>
                <CardTitle className="text-base font-bold tracking-tight">{shipment.trackingNumber}</CardTitle>
            </div>
            <ShipmentStatusBadge status={shipment.status} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mb-4">
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <span>{shipment.origin}</span>
                <ArrowRight className="h-4 w-4" />
                <span>{shipment.destination}</span>
            </div>
            <Progress value={progressValue} className="mt-2 h-2" />
        </div>
        <Separator />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-muted/50 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Est. Delivery: {shipment.estimatedDelivery}</span>
        </div>
        <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Last update: {shipment.updatedAt}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
