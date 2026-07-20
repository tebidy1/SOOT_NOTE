"use client"

import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { InboxNoteRowActions } from "./row-actions"

export interface NoteOutput {
  id: number
  inbox_note_id: number
  macro_id: number
  title: string
  content?: string
}

export interface FieldMapping {
  form_field: string
  form_type: string
  value: string | null
  matched_key: string | null
  confidence: number
}

export interface SuggestedMacro {
  id: number
  user_id: number
  company_id: number
  trigger: string
  category: string
  content: string
  is_ai_macro: boolean
  is_favorite?: boolean
  ai_instruction?: string | null
  usage_count: number
  last_used?: string | null
  created_at: string
  updated_at: string
}

export interface InboxNote {
  id: string
  patient_name: string
  raw_text: string
  original_text?: string | null
  formatted_text?: string | null
  summary: string | null
  status: string
  user: { id: number; name: string } | null
  company?: { id: number; name: string; domain?: string | null }
  outputs?: NoteOutput[]
  field_mappings?: FieldMapping[]
  suggested_macro?: SuggestedMacro | null
  applied_macro_id?: number | null
  suggested_macro_id?: number | null
  audio_path?: string | null
  created_at: string
  updated_at: string
}

interface ColumnOptions {
  serverSide?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  processed: 'تمت المعالجة',
  archived: 'مؤرشفة',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  pending: 'default',
  processed: 'secondary',
  archived: 'outline',
}

export const getColumns = (
  onView: (note: InboxNote) => void,
  onDelete: (note: InboxNote) => void,
  options?: ColumnOptions,
): ColumnDef<InboxNote>[] => [
  {
    accessorKey: "patient_name",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="اسم المريض"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const name = row.getValue("patient_name") as string
      return <span className="font-medium">{name || 'بدون اسم'}</span>
    },
  },
  {
    accessorKey: "raw_text",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="النص"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const text = row.getValue("raw_text") as string
      return <p className="truncate max-w-[300px] text-muted-foreground">{text || '—'}</p>
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
        <Badge variant={statusVariants[status] || 'outline'}>
          {statusLabels[status] || status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "user",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="المستخدم"
        serverSide={options?.serverSide}
        sortColumn={options?.sortColumn}
        sortDirection={options?.sortDirection}
        onSort={options?.onSort}
      />
    ),
    cell: ({ row }) => {
      const user = row.original.user
      return <span>{user?.name || '—'}</span>
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
      <InboxNoteRowActions
        row={row}
        onView={onView}
        onDelete={onDelete}
      />
    ),
  },
]
