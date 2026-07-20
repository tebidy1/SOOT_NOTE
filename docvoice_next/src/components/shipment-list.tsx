'use client';

import type { Shipment } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShipmentCard } from './shipment-card';
import { useMemo } from 'react';

interface ShipmentListProps {
  shipments: Shipment[];
}

export function ShipmentList({ shipments }: ShipmentListProps) {
  const { activeShipments, historyShipments } = useMemo(() => {
    const active = shipments.filter((s) => s.status !== 'Delivered');
    const history = shipments.filter((s) => s.status === 'Delivered');
    return { activeShipments: active, historyShipments: history };
  }, [shipments]);

  return (
    <Tabs defaultValue="active">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active">Active ({activeShipments.length})</TabsTrigger>
        <TabsTrigger value="history">History ({historyShipments.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="mt-4">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {activeShipments.length > 0 ? (
            activeShipments.map((shipment) => <ShipmentCard key={shipment.id} shipment={shipment} />)
          ) : (
            <p className="md:col-span-2 text-center text-muted-foreground">No active shipments.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="history" className="mt-4">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {historyShipments.length > 0 ? (
            historyShipments.map((shipment) => <ShipmentCard key={shipment.id} shipment={shipment} />)
          ) : (
            <p className="md:col-span-2 text-center text-muted-foreground">No shipment history.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
