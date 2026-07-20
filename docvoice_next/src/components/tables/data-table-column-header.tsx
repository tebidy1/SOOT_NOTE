"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDown,
} from "lucide-react";
import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  serverSide?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  serverSide = false,
  sortColumn,
  sortDirection,
  onSort,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const getSortIcon = () => {
    if (serverSide) {
      if (sortColumn === column.id) {
        return sortDirection === 'desc' ? (
          <ArrowDownIcon className="ms-2 h-4 w-4" />
        ) : (
          <ArrowUpIcon className="ms-2 h-4 w-4" />
        );
      }
      return <ChevronsUpDown className="ms-2 h-4 w-4" />;
    }

    const isSorted = column.getIsSorted();
    if (isSorted === "desc") return <ArrowDownIcon className="ms-2 h-4 w-4" />;
    if (isSorted === "asc") return <ArrowUpIcon className="ms-2 h-4 w-4" />;
    return <ChevronsUpDown className="ms-2 h-4 w-4" />;
  };

  const handleSortAsc = () => {
    if (serverSide && onSort) {
      onSort(column.id, 'asc');
    } else {
      column.toggleSorting(false);
    }
  };

  const handleSortDesc = () => {
    if (serverSide && onSort) {
      onSort(column.id, 'desc');
    } else {
      column.toggleSorting(true);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ms-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {getSortIcon()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleSortAsc}>
            <ArrowUpIcon className="me-2 h-3.5 w-3.5 text-muted-foreground/70" />
            تصاعدي
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSortDesc}>
            <ArrowDownIcon className="me-2 h-3.5 w-3.5 text-muted-foreground/70" />
            تنازلي
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
