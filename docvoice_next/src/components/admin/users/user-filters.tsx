'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UsersFilters, UserStatus, UserRole } from '@/types/users';
import { Search } from 'lucide-react';

interface UserFiltersProps {
  filters: UsersFilters;
  onFiltersChange: (filters: UsersFilters) => void;
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value === 'all' ? undefined : value as UserStatus,
      page: 1 
    });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      role: value === 'all' ? undefined : value as UserRole,
      page: 1 
    });
  };

  const handleLimitChange = (value: string) => {
    onFiltersChange({ ...filters, limit: parseInt(value), page: 1 });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث بالاسم، البريد أو الهاتف..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pe-10"
        />
      </div>

      <Select
        value={filters.status || 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الحالات</SelectItem>
          <SelectItem value="active">نشط</SelectItem>
          <SelectItem value="inactive">غير نشط</SelectItem>
          <SelectItem value="pending">معلق</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.role || 'all'}
        onValueChange={handleRoleChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="الدور" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الأدوار</SelectItem>
          <SelectItem value="admin">مدير</SelectItem>
          <SelectItem value="manager">مدير تنفيذي</SelectItem>
          <SelectItem value="user">مستخدم</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={String(filters.limit || 10)}
        onValueChange={handleLimitChange}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="عدد العناصر" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 عناصر</SelectItem>
          <SelectItem value="25">25 عنصر</SelectItem>
          <SelectItem value="50">50 عنصر</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
