"use client"

import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterColumn: string;
  children?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  filterColumn,
  children,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="ابحث..."
          value={
            (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn(filterColumn)?.setFilterValue(event.target.value)
          }
          className="h-10 w-full md:w-[300px] rounded-xl"
        />
        {children}
      </div>
    </div>
  )
}
