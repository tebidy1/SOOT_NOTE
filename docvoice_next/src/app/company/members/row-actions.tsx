"use client"

import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff } from "lucide-react"
import { Member } from "./columns"

interface CompanyMemberRowActionsProps {
  row: Row<Member>
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
  onToggleStatus: (member: Member) => void
}

export function CompanyMemberRowActions({
  row,
  onEdit,
  onDelete,
  onToggleStatus,
}: CompanyMemberRowActionsProps) {
  const member = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onEdit(member)}>
          <Pencil className="mr-2 h-4 w-4" />
          تعديل
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleStatus(member)}>
          {member.status === 'active' ? (
            <><PowerOff className="mr-2 h-4 w-4" /> تعطيل</>
          ) : (
            <><Power className="mr-2 h-4 w-4" /> تفعيل</>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(member)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
