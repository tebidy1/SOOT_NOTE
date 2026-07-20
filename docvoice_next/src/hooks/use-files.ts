'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientFilesService } from '@/lib/services/client-files.service';
import { showSuccess, showError } from '@/lib/services/notification.service';
import { ApiError } from '@/lib/api/api-error';

const FILES_QUERY_KEY = 'files';

export class CompleteProfileError extends Error {
  constructor() {
    super('يرجى إكمال الملف الشخصي للوصول إلى هذه الميزة');
    this.name = 'CompleteProfileError';
  }
}

function handleFileError(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.isForbidden() && error.errors?.complete_profile) {
      throw new CompleteProfileError();
    }
  }
  throw error;
}

export function useFiles(params = {}) {
  return useQuery({
    queryKey: [FILES_QUERY_KEY, params],
    queryFn: () => clientFilesService.getAll(params).catch(handleFileError),
  });
}

export function useFilesByFolder(folder = null, params = {}) {
  return useQuery({
    queryKey: [FILES_QUERY_KEY, 'folder', folder, params],
    queryFn: () => clientFilesService.getByFolder(folder, params).catch(handleFileError),
  });
}

export function useFileStats() {
  return useQuery({
    queryKey: [FILES_QUERY_KEY, 'stats'],
    queryFn: () => clientFilesService.getStats(),
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, folder, isPublic }) => 
      clientFilesService.upload(file, folder, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FILES_QUERY_KEY] });
      showSuccess('تم رفع الملف بنجاح');
    },
    onError: (error) => {
      showError(error.message || 'فشل رفع الملف');
    },
  });
}

export function useUploadMultipleFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ files, folder, isPublic }) => 
      clientFilesService.uploadMultiple(files, folder, isPublic),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [FILES_QUERY_KEY] });
      const count = data?.files?.length || 0;
      showSuccess(`تم رفع ${count} ملفات بنجاح`);
    },
    onError: (error) => {
      showError(error.message || 'فشل رفع الملفات');
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => clientFilesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FILES_QUERY_KEY] });
      showSuccess('تم حذف الملف بنجاح');
    },
    onError: (error) => {
      showError(error.message || 'فشل حذف الملف');
    },
  });
}
