"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { UserTableRowActions } from "./row-actions"

export interface User {
  id: string
  name: string
  email: string
  phone_number: string
  role: string
  status: string
  created_at: string
  avatar?: string
  company?: string
  company_id?: string | number
  medical_department_id?: string | number
  medical_department?: { id: number; name_ar: string; name_en: string } | null
}

interface ColumnOptions {
  serverSide?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

export const getColumns = (
  onEdit: (user: User) => void,
  onDelete: (user: User) => void,
  onToggleStatus: (user: User) => void,
  onResetPassword: (user: User) => void,
  options?: ColumnOptions,
): ColumnDef<User>[] => [
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
      const user = row.original
      return (
        <div className="flex items-center gap-2">
          {user.avatar && (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <span className="font-medium">{user.name}</span>
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
    accessorKey: "phone_number",
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
      const roleLabels: Record<string, string> = {
        admin: 'مدير النظام',
        company_manager: 'مدير الشركة',
        member: 'عضو',
      }
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
          {status === "active" ? "نشط" : "غير نشط"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "company",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="الشركة"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const company = row.getValue("company")
      if (!company) return "—"
      if (typeof company === "object") return (company as { name?: string }).name || "—"
      return company as string
    },
  },
  {
    accessorKey: "medical_department",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="القسم"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const dept = row.original.medical_department
      if (!dept) return "—"
      return dept.name_ar || dept.name_en || "—"
    },
  },
  {
    accessorKey: "created_at",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="تاريخ الإنشاء"
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
      <UserTableRowActions
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onResetPassword={onResetPassword}
      />
    ),
  },
]
