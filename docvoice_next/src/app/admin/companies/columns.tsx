"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { CompanyTableRowActions } from "./row-actions"

export interface Company {
  id: number
  name: string
  invitation_code?: string
  code?: string
  plan_type: string
  status: string
  created_at: string
  updated_at: string
  users_count?: number
}

interface ColumnOptions {
  serverSide?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

export const getColumns = (
  onEdit: (company: Company) => void,
  onDelete: (company: Company) => void,
  onToggleStatus: (company: Company) => void,
  onSettings: (company: Company) => void,
  options?: ColumnOptions,
): ColumnDef<Company>[] => [
  {
    accessorKey: "name",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="companyName"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "plan_type",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="planType"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const plan = row.getValue("plan_type") as string
      const planLabels: Record<string, string> = {
        basic: 'basic',
        standard: 'standard',
        premium: 'premium',
      }
      return <Badge variant="outline">{planLabels[plan] || plan}</Badge>
    },
  },
  {
    accessorKey: "status",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="companyStatus"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === 'active' ? "default" : "secondary"}>
          {status === 'active' ? 'active' : 'suspended'}
        </Badge>
      )
    },
  },
  {
    accessorKey: "users_count",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="usersCount"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => row.getValue("users_count") || 0,
  },
  {
    accessorKey: "created_at",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="createdAt"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return date.toLocaleDateString("ar-SA")
    },
  },
  {
    id: "actions",
    header: "actions",
    cell: ({ row }) => (
      <CompanyTableRowActions
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onSettings={onSettings}
      />
    ),
  },
]
