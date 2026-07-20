import { useState, useCallback } from 'react';

interface UseDataTableOptions {
  initialPage?: number;
  initialPerPage?: number;
  initialSortColumn?: string;
  initialSortDirection?: 'asc' | 'desc';
}

export function useDataTable(options: UseDataTableOptions = {}) {
  const {
    initialPage = 1,
    initialPerPage = 10,
    initialSortColumn = 'created_at',
    initialSortDirection = 'desc',
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [sortColumn, setSortColumn] = useState(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePerPageChange = useCallback((newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    perPage,
    sortColumn,
    sortDirection,
    searchQuery,
    setCurrentPage,
    setPerPage,
    setSortColumn,
    setSortDirection,
    setSearchQuery,
    handlePageChange,
    handlePerPageChange,
    handleSort,
    handleSearch,
    resetPagination,
  };
}
