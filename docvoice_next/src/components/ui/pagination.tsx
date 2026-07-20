"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  serverSide?: boolean;
  currentPage?: number;
  perPage?: number;
  totalCount?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

export function DataTablePagination<TData>({
  table,
  serverSide = false,
  currentPage = 1,
  perPage = 15,
  totalCount = 0,
  pageCount = 1,
  onPageChange,
  onPerPageChange,
}: DataTablePaginationProps<TData>) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (pageCount <= maxVisible) {
      for (let i = 1; i <= pageCount; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(pageCount);
      } else if (currentPage >= pageCount - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = pageCount - 3; i <= pageCount; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(pageCount);
      }
    }
    
    return pages;
  };

  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < pageCount;
  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-4 px-2 sm:flex-row">
      <div className="text-sm text-muted-foreground font-body">
        إجمالي {totalCount} صف(وف).
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <div className="hidden items-center space-x-2 rtl:space-x-reverse sm:flex">
          <p className="text-sm font-medium">عدد الصفوف</p>
          <Select
            value={`${perPage}`}
            onValueChange={(value) => {
              onPerPageChange?.(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={perPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 15, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-1 rtl:space-x-reverse">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange?.(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">الصفحة الأولى</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">الصفحة السابقة</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {pageNumbers.map((page, index) => (
            typeof page === 'number' ? (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                className="h-8 w-8 p-0"
                onClick={() => onPageChange?.(page)}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-2 text-muted-foreground">
                {page}
              </span>
            )
          ))}
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">الصفحة التالية</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange?.(pageCount)}
            disabled={!canNextPage}
          >
            <span className="sr-only">الصفحة الأخيرة</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
