"use client"

import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash2 } from "lucide-react"
import { InboxNote } from "./columns"

interface InboxNoteRowActionsProps {
  row: Row<InboxNote>
  onView: (note: InboxNote) => void
  onDelete: (note: InboxNote) => void
}

export function InboxNoteRowActions({
  row,
  onView,
  onDelete,
}: InboxNoteRowActionsProps) {
  const note = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onView(note)}>
          <Eye className="mr-2 h-4 w-4" />
          عرض
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(note)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
