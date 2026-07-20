"use client"

import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff, Settings } from "lucide-react"
import { Company } from "./columns"

interface CompanyTableRowActionsProps {
  row: Row<Company>
  onEdit: (company: Company) => void
  onDelete: (company: Company) => void
  onToggleStatus: (company: Company) => void
  onSettings: (company: Company) => void
}

export function CompanyTableRowActions({
  row,
  onEdit,
  onDelete,
  onToggleStatus,
  onSettings,
}: CompanyTableRowActionsProps) {
  const company = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onEdit(company)}>
          <Pencil className="mr-2 h-4 w-4" />
          تعديل
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSettings(company)}>
          <Settings className="mr-2 h-4 w-4" />
          الإعدادات
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleStatus(company)}>
          {company.status === 'active' ? (
            <><PowerOff className="mr-2 h-4 w-4" /> تعليق</>
          ) : (
            <><Power className="mr-2 h-4 w-4" /> تفعيل</>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(company)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
