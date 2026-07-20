"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { CompanyMemberRowActions } from "./row-actions"

export interface Member {
  id: string
  name: string
  email: string
  phone_number: string
  phone: string
  role: string
  status: string
  created_at: string
  avatar?: string
}

interface ColumnOptions {
  serverSide?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

const roleLabels: Record<string, string> = {
  company_manager: 'مدير الشركة',
  member: 'عضو',
  admin: 'مدير النظام',
}

const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
}

export const getColumns = (
  onEdit: (member: Member) => void,
  onDelete: (member: Member) => void,
  onToggleStatus: (member: Member) => void,
  options?: ColumnOptions,
): ColumnDef<Member>[] => [
  {
    accessorKey: "name",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="الاسم"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const member = row.original
      return (
        <div className="flex items-center gap-2">
          {member.avatar && (
            <img
              src={member.avatar}
              alt={member.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <span className="font-medium">{member.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="البريد الإلكتروني"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
  },
  {
    accessorKey: "phone",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="رقم الهاتف"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const phone = row.original.phone || row.original.phone_number
      return phone || "—"
    },
  },
  {
    accessorKey: "role",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="الدور"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant="outline">
          {roleLabels[role] || role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="الحالة"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {statusLabels[status] || status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="تاريخ الإنضمام"
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
    header: "الإجراءات",
    cell: ({ row }) => (
      <CompanyMemberRowActions
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      />
    ),
  },
]
