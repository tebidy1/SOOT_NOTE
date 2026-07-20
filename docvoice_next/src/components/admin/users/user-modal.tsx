'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, CreateUserData } from '@/types/users';
import { UserForm } from './user-form';

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmit: (data: CreateUserData) => void;
  isLoading?: boolean;
}

export function UserModal({ open, onOpenChange, user, onSubmit, isLoading }: UserModalProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {user ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
          </DialogTitle>
        </DialogHeader>
        <UserForm
          user={user || undefined}
          onSubmit={onSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
