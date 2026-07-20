"use client"
import * as React from "react"
import { useEffect } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/pagination"
import { PageHeader } from "../shared/page-header"
import { Card, CardContent } from "../ui/card"
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { DataTableSkeleton } from "./data-table-skeleton"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageTitle: string;
  pageDescription?: string;
  filterColumn?: string;
  onAdd?: () => void;
  addLabel?: string;
  isLoading?: boolean;
  toolbarExtra?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  serverSide?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  currentPage?: number;
  perPage?: number;
  totalCount?: number;
  pageCount?: number;
  searchQuery?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageTitle,
  pageDescription,
  filterColumn,
  onAdd,
  addLabel,
  isLoading,
  toolbarExtra,
  toolbarActions,
  serverSide = false,
  onSort,
  onSearch,
  onPageChange,
  onPerPageChange,
  currentPage = 1,
  perPage = 15,
  totalCount = 0,
  pageCount = 1,
  searchQuery = '',
  sortColumn = '',
  sortDirection = 'desc',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [pagination, setPagination] = React.useState({
    pageIndex: currentPage - 1,
    pageSize: perPage,
  })

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updater) => {
      if (serverSide && onSort) {
        const newSorting = typeof updater === 'function' ? updater(sorting) : updater
        if (newSorting.length > 0) {
          const { id, desc } = newSorting[0]
          onSort(id, desc ? 'desc' : 'asc')
        } else {
          onSort('created_at', 'desc')
        }
      } else {
        setSorting(updater)
      }
    },
    getSortedRowModel: serverSide ? undefined : getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    ...(serverSide ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    state: {
      sorting: serverSide ? [] : sorting,
      columnFilters: serverSide ? [] : columnFilters,
      globalFilter: serverSide ? undefined : globalFilter,
      pagination,
    },
    pageCount: serverSide ? pageCount : undefined,
    manualPagination: serverSide,
    manualSorting: serverSide,
    manualFiltering: serverSide,
  })

  useEffect(() => {
    setPagination({
      pageIndex: currentPage - 1,
      pageSize: perPage,
    })
  }, [currentPage, perPage])

  const handleSearchChange = (value: string) => {
    if (serverSide && onSearch) {
      onSearch(value)
    } else {
      setGlobalFilter(value)
      table.setGlobalFilter(value)
    }
  }

  const handlePageChange = (page: number) => {
    if (serverSide && onPageChange) {
      onPageChange(page)
    } else {
      table.setPageIndex(page - 1)
    }
  }

  const handlePerPageChange = (newPerPage: number) => {
    if (serverSide && onPerPageChange) {
      onPerPageChange(newPerPage)
      if (onPageChange) {
        onPageChange(1)
      }
    } else {
      table.setPageSize(newPerPage)
    }
  }

  const getSortIcon = (columnId: string) => {
    if (!serverSide) {
      const column = table.getColumn(columnId)
      if (!column) return <ArrowUpDown className="ml-2 h-4 w-4" />
      const isSorted = column.getIsSorted()
      if (isSorted === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />
      if (isSorted === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    
    if (sortColumn === columnId) {
      return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  return (
    <div className="space-y-4">
        <PageHeader title={pageTitle} description={pageDescription}>
            {toolbarActions || (
              onAdd && addLabel && (
                <Button onClick={onAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {addLabel}
                </Button>
              )
            )}
        </PageHeader>
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <div className="flex items-center gap-4 flex-1">
                        {filterColumn !== undefined && (
                          <div className="relative max-w-sm flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                              <Input
                                  placeholder="بحث..."
                                  value={serverSide ? searchQuery : globalFilter}
                                  onChange={(e) => handleSearchChange(e.target.value)}
                                  className="ps-9 w-full"
                              />
                          </div>
                        )}
                        {toolbarExtra}
                    </div>
                </div>
                <div className="px-6 pb-4">
                    {isLoading ? (
                        <DataTableSkeleton columnCount={columns.length} rowCount={perPage} />
                    ) : (
                        <>
                            <div className="rounded-xl border bg-card overflow-x-auto">
                                <Table className="min-w-full">
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="bg-muted/30">
                                        {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} className="font-bold text-foreground/70 text-xs uppercase tracking-wider">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            </TableHead>
                                        )
                                        })}
                                    </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="hover:bg-muted/40 transition-colors"
                                        >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                            </TableCell>
                                        ))}
                                        </TableRow>
                                    ))
                                    ) : (
                                    <TableRow>
                                        <TableCell
                                        colSpan={columns.length}
                                        className="h-32 text-center"
                                        >
                                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <Search className="h-8 w-8 text-muted-foreground/30" />
                                            <p className="font-medium">No results found</p>
                                        </div>
                                        </TableCell>
                                    </TableRow>
                                    )}
                                </TableBody>
                                </Table>
                            </div>
                            <div className="mt-4">
                                <DataTablePagination 
                                    table={table} 
                                    serverSide={serverSide}
                                    currentPage={currentPage}
                                    perPage={perPage}
                                    totalCount={totalCount}
                                    pageCount={pageCount}
                                    onPageChange={handlePageChange}
                                    onPerPageChange={handlePerPageChange}
                                />
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
