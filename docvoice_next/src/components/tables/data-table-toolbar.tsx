"use client";

import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserForm } from "../forms/user-form";
import { ShipmentForm } from "../forms/shipment-form";


interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  refetch: () => void;
  entity: "User" | "Driver" | "Shipment";
}

export function DataTableToolbar<TData>({
  table,
  refetch,
  entity
}: DataTableToolbarProps<TData>) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  let FormComponent;
  let filterColumn = 'name';
  switch (entity) {
    case 'User':
    case 'Driver':
      FormComponent = UserForm;
      break;
    case 'Shipment':
      FormComponent = ShipmentForm;
      filterColumn = 'trackingNumber';
      break;
    default:
      return null;
  }
  const entityName = entity === 'Driver' ? 'User' : entity;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={`Filter by ${filterColumn}...`}
          value={
            (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn(filterColumn)?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
      </div>
      <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-8">
        <PlusCircle className="me-2 h-4 w-4" />
        Add {entity}
      </Button>

      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {entity}</DialogTitle>
          </DialogHeader>
          <FormComponent
            onFinished={() => {
              setCreateModalOpen(false);
              refetch();
            }}
            // Pass role if we are creating a driver
            initialData={entity === 'Driver' ? { role: 'Driver' } : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
