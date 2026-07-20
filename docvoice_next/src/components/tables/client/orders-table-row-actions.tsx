"use client";

import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Order } from "@/types";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useSetRecoilState } from "recoil";
import { orderToTrackState } from "@/store/order-tracking-store";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const order = row.original as Order;
  const setOrderToTrack = useSetRecoilState(orderToTrackState);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem asChild>
          <Link href={`/client/orders/${order.id}`}>View Details</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOrderToTrack(order)}>
          Track on Map
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
