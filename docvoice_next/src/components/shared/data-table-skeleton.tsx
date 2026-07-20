"use client"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table"

interface DataTableSkeletonProps {
  columnCount: number
  rowCount?: number
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
}: DataTableSkeletonProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow className="bg-muted/30">
                    {Array.from({ length: columnCount }).map((_, i) => (
                        <TableHead key={i}>
                            <Skeleton className="h-4 w-24" />
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: rowCount }).map((_, i) => (
                    <TableRow key={i}>
                    {Array.from({ length: columnCount }).map((_, j) => (
                        <TableCell key={j}>
                            <Skeleton className={`h-4 ${j === 0 ? 'w-3/4' : 'w-full'}`} />
                        </TableCell>
                    ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  )
}
