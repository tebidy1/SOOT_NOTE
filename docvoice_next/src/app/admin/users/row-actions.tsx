"use client"

import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff, Key } from "lucide-react"
import { User } from "./columns"

interface UserTableRowActionsProps {
  row: Row<User>
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleStatus: (user: User) => void
  onResetPassword: (user: User) => void
}

export function UserTableRowActions({
  row,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
}: UserTableRowActionsProps) {
  const user = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Pencil className="mr-2 h-4 w-4" />
          تعديل
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleStatus(user)}>
          {user.status === 'active' ? (
            <><PowerOff className="mr-2 h-4 w-4" /> تعطيل</>
          ) : (
            <><Power className="mr-2 h-4 w-4" /> تفعيل</>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResetPassword(user)}>
          <Key className="mr-2 h-4 w-4" />
          إعادة تعيين كلمة المرور
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
