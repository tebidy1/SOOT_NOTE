'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  LayoutGrid, 
  List, 
  FolderPlus, 
  Upload, 
  MoreVertical, 
  Folder, 
  File, 
  FileText, 
  Image as ImageIcon, 
  FileVideo, 
  Download, 
  Pencil, 
  Trash2, 
  ChevronRight, 
  X, 
  Search,
  Eye,
  CornerUpRight,
  Loader2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { showSuccess, showError, showInfo } from '@/lib/services/notification.service';
import { cn } from '@/lib/utils';
import { ManagedItem, ManagedFile, ManagedFolder } from './types';
import NextImage from 'next/image';
import { 
  useFilesByFolder, 
  useUploadFile, 
  useUploadMultipleFiles, 
  useDeleteFile,
  CompleteProfileError
} from '@/hooks/use-files';
import { clientFilesService, buildFileUrl } from '@/lib/services/client-files.service';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiError } from '@/lib/api/api-error';

interface FileManagerProps {
  initialItems?: ManagedItem[];
}

interface ApiFile {
  id: number;
  file_name: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  folder: string | null;
  created_at: string;
}

export function FileManager({ initialItems = [] }: FileManagerProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: filesData, isLoading, error } = useFilesByFolder(currentFolderId);
  
  const uploadFileMutation = useUploadFile();
  const uploadMultipleMutation = useUploadMultipleFiles();
  const deleteMutation = useDeleteFile();

  const items = useMemo(() => {
    if (!filesData?.data) return [];
    
    return filesData.data.map((file: ApiFile): ManagedFile => ({
      id: String(file.id),
      name: file.original_name,
      parentId: file.folder,
      createdAt: file.created_at,
      itemType: 'file',
      size: file.size,
      mimeType: file.mime_type,
      url: buildFileUrl(file.path),
    }));
  }, [filesData]);

  const currentPath = useMemo(() => {
    const path: ManagedFolder[] = [];
    let tempId = currentFolderId;
    while (tempId) {
      const folder = items.find((i: ManagedItem) => i.id === tempId && i.itemType === 'folder') as ManagedFolder;
      if (folder) {
        path.unshift(folder);
        tempId = folder.parentId;
      } else break;
    }
    return path;
  }, [currentFolderId, items]);

  const parentFolderId = useMemo(() => {
    if (!currentFolderId) return null;
    const currentFolder = items.find((i: ManagedItem) => i.id === currentFolderId) as ManagedFolder;
    return currentFolder ? currentFolder.parentId : null;
  }, [currentFolderId, items]);

  const currentItems = useMemo(() => {
    return items.filter((item: ManagedItem) => {
      const matchesFolder = item.parentId === currentFolderId;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFolder && matchesSearch;
    }).sort((a: ManagedItem, b: ManagedItem) => {
      if (a.itemType === 'folder' && b.itemType === 'file') return -1;
      if (a.itemType === 'file' && b.itemType === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [items, currentFolderId, searchQuery]);

  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<ManagedItem | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const handleFolderClick = (id: string | null) => {
    setCurrentFolderId(id);
    setSearchQuery('');
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    showInfo('إنشاء المجلدات غير مدعوم حالياً في النظام الخلفي');
    setNewFolderName('');
    setIsNewFolderOpen(false);
  };

  const handleRename = () => {
    if (!selectedItem || !newFolderName.trim()) return;
    showInfo('إعادة التسمية غير مدعومة حالياً في النظام الخلفي');
    setNewFolderName('');
    setSelectedItem(null);
    setIsRenameOpen(false);
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    
    const fileId = parseInt(selectedItem.id);
    deleteMutation.mutate(fileId, {
      onSuccess: () => {
        setSelectedItem(null);
        setIsDeleteOpen(false);
      }
    });
  };

  const handleDownload = useCallback(async (item: ManagedItem) => {
    if (item.itemType !== 'file') {
      showError('تعذر تحميل هذا الملف');
      return;
    }
    
    try {
      const file = item as ManagedFile;
      const downloadUrl = file.url;
      
      showInfo('جاري تحميل الملف...');
      window.open(downloadUrl, '_blank');
    } catch (err) {
      showError('فشل تحميل الملف');
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setStagedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = () => {
    if (stagedFiles.length === 0) return;

    if (stagedFiles.length === 1) {
      uploadFileMutation.mutate(
        { file: stagedFiles[0], folder: currentFolderId, isPublic: true },
        {
          onSuccess: () => {
            setStagedFiles([]);
            setIsUploadOpen(false);
          }
        }
      );
    } else {
      uploadMultipleMutation.mutate(
        { files: stagedFiles, folder: currentFolderId, isPublic: true },
        {
          onSuccess: () => {
            setStagedFiles([]);
            setIsUploadOpen(false);
          }
        }
      );
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (item: ManagedItem, showThumbnail: boolean = false) => {
    if (item.itemType === 'folder') return <Folder className="text-blue-500 fill-blue-500/20" />;
    if (item.mimeType.startsWith('image/')) {
      if (showThumbnail && item.itemType === 'file' && item.url) {
        return (
          <NextImage
            src={item.url}
            alt={item.name}
            width={64}
            height={64}
            className="object-cover rounded"
            unoptimized
          />
        );
      }
      return <ImageIcon className="text-purple-500" />;
    }
    if (item.mimeType.startsWith('video/')) return <FileVideo className="text-orange-500" />;
    if (item.mimeType === 'application/pdf') return <FileText className="text-red-500" />;
    return <File className="text-slate-400" />;
  };

  useEffect(() => {
    return () => stagedFiles.forEach(file => {
      if ((file as any).preview) URL.revokeObjectURL((file as any).preview);
    });
  }, [stagedFiles]);

  const isUploading = uploadFileMutation.isPending || uploadMultipleMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const isCompleteProfileError = error instanceof CompleteProfileError || 
    (error instanceof ApiError && error.isForbidden() && error.errors?.complete_profile);

  if (isCompleteProfileError) {
    return (
      <div className="space-y-6" dir="rtl">
        <Alert variant="destructive" className="border-amber-500 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">الملف الشخصي غير مكتمل</AlertTitle>
          <AlertDescription className="text-amber-700">
            يجب إكمال الملف الشخصي للوصول إلى مدير الملفات.
          </AlertDescription>
          <div className="mt-4">
            <Button onClick={() => router.push('/admin/onboarding/step-1')}>
              إكمال الملف الشخصي
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button 
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
            size="icon" 
            onClick={() => setViewMode('grid')}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            size="icon" 
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="البحث في الملفات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 h-10"
            />
          </div>
          <Button onClick={() => setIsNewFolderOpen(true)} variant="outline" className="h-10 font-bold">
            <FolderPlus className="h-4 w-4 ml-2" />
            مجلد جديد
          </Button>
          <Button onClick={() => setIsUploadOpen(true)} className="h-10 font-bold">
            <Upload className="h-4 w-4 ml-2" />
            رفع ملفات
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-medium overflow-x-auto pb-2 no-scrollbar">
        <button 
          type="button"
          onClick={() => handleFolderClick(null)}
          className={cn(
            "hover:text-primary transition-colors whitespace-nowrap",
            currentFolderId === null ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          ملفاتي
        </button>
        {currentPath.map((folder, idx) => (
          <React.Fragment key={folder.id}>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
            <button 
              type="button"
              onClick={() => handleFolderClick(folder.id)}
              className={cn(
                "hover:text-primary transition-colors whitespace-nowrap",
                idx === currentPath.length - 1 ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              {folder.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {(currentItems.length > 0 || currentFolderId !== null) ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentFolderId !== null && (
              <Card 
                className="group relative border-dashed hover:border-primary transition-all cursor-pointer bg-slate-50 dark:bg-slate-900/50"
                onDoubleClick={() => handleFolderClick(parentFolderId)}
                onClick={() => handleFolderClick(parentFolderId)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center gap-3 text-center aspect-square opacity-60 group-hover:opacity-100">
                  <div className="size-16 flex items-center justify-center">
                    <CornerUpRight className="size-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-bold truncate w-full px-2">للأعلى</p>
                </CardContent>
              </Card>
            )}

            {currentItems.map((item) => (
              <Card 
                key={item.id} 
                className="group relative hover:border-primary transition-all cursor-pointer overflow-hidden"
                onDoubleClick={() => item.itemType === 'folder' ? handleFolderClick(item.id) : null}
                onClick={() => item.itemType === 'file' ? (setSelectedItem(item), setIsPreviewOpen(true)) : (item.itemType === 'folder' ? handleFolderClick(item.id) : null)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center gap-3 text-center aspect-square">
                  <div className="size-16 flex items-center justify-center">
                    {item.itemType === 'folder' ? (
                      <Folder className="size-14 text-blue-500 fill-blue-500/10" />
                    ) : (
                      getFileIcon(item, true)
                    )}
                  </div>
                  <p className="text-sm font-bold truncate w-full px-2" title={item.name}>
                    {item.name}
                  </p>
                  
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {item.itemType === 'file' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setIsPreviewOpen(true); }}>
                            <Eye className="h-4 w-4 ml-2" /> معاينة
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setNewFolderName(item.name); setIsRenameOpen(true); }}>
                          <Pencil className="h-4 w-4 ml-2" /> إعادة تسمية
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setIsDeleteOpen(true); }}>
                          <Trash2 className="h-4 w-4 ml-2" /> حذف
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(item); }}>
                          <Download className="h-4 w-4 ml-2" /> تحميل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-xs font-bold uppercase text-muted-foreground tracking-wider">
              <div className="col-span-6 text-start">الاسم</div>
              <div className="col-span-3 text-start">تاريخ الإنشاء</div>
              <div className="col-span-2 text-start">الحجم</div>
              <div className="col-span-1 text-left"></div>
            </div>
            <div className="divide-y">
              {currentFolderId !== null && (
                <div 
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/30 transition-colors items-center cursor-pointer group opacity-60"
                  onClick={() => handleFolderClick(parentFolderId)}
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <CornerUpRight className="size-4" />
                    </div>
                    <span className="text-sm font-bold">.. (مجلد أعلى)</span>
                  </div>
                  <div className="col-span-6"></div>
                </div>
              )}

              {currentItems.map((item) => (
                <div 
                  key={item.id} 
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/30 transition-colors items-center cursor-pointer group"
                  onClick={() => {
                    if (item.itemType === 'folder') handleFolderClick(item.id);
                    else { setSelectedItem(item); setIsPreviewOpen(true); }
                  }}
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0">
                      {getFileIcon(item)}
                    </div>
                    <span className="text-sm font-bold truncate">{item.name}</span>
                  </div>
                  <div className="col-span-3 text-xs text-muted-foreground text-start">
                    {format(new Date(item.createdAt), 'PP p', { locale: ar })}
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground text-start">
                    {item.itemType === 'file' ? formatSize(item.size) : '--'}
                  </div>
                  <div className="col-span-1 text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setNewFolderName(item.name); setIsRenameOpen(true); }}>
                          <Pencil className="h-4 w-4 ml-2" /> إعادة تسمية
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setIsDeleteOpen(true); }}>
                          <Trash2 className="h-4 w-4 ml-2" /> حذف
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(item); }}>
                          <Download className="h-4 w-4 ml-2" /> تحميل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/20">
          <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Folder className="size-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold">هذا المجلد فارغ</h3>
          <p className="text-muted-foreground mt-1">ابدأ برفع الملفات أو إنشاء مجلد جديد.</p>
          <div className="flex gap-2 mt-6">
            <Button onClick={() => setIsNewFolderOpen(true)} variant="outline">إنشاء مجلد</Button>
            <Button onClick={() => setIsUploadOpen(true)}>رفع ملفات</Button>
          </div>
        </div>
      )}

      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مجلد جديد</DialogTitle>
            <DialogDescription>أدخل اسماً للمجلد الجديد الخاص بك.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="اسم المجلد" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewFolderOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreateFolder}>إنشاء المجلد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعادة تسمية</DialogTitle>
            <DialogDescription>أدخل اسماً جديداً لهذا العنصر.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="الاسم الجديد" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRenameOpen(false)}>إلغاء</Button>
            <Button onClick={handleRename}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف <strong>{selectedItem?.name}</strong> بشكل نهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>رفع الملفات</DialogTitle>
            <DialogDescription>قم بسحب وإفلات الملفات هنا لرفعها إلى هذا المجلد.</DialogDescription>
          </DialogHeader>
          
          <div 
            {...getRootProps()} 
            className={cn(
              "mt-4 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="size-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">انقر للرفع أو قم بالسحب والإفلات</p>
            <p className="text-xs text-muted-foreground mt-1">الحد الأقصى لحجم الملف: 10 ميجابايت</p>
          </div>

          {stagedFiles.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-bold mb-3 flex items-center justify-between">
                <span>الملفات المختارة ({stagedFiles.length})</span>
                <button onClick={() => setStagedFiles([])} className="text-xs text-destructive hover:underline">مسح الكل</button>
              </p>
              <ScrollArea className="h-40 border rounded-lg p-2">
                <div className="space-y-2">
                  {stagedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                      <div className="flex items-center gap-2 truncate pl-4 text-start">
                        <File className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>إلغاء</Button>
            <Button onClick={handleUpload} disabled={stagedFiles.length === 0 || isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              رفع {stagedFiles.length} ملفات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-950 border-none">
          <div className="relative flex flex-col h-[80vh]">
            <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur text-white z-10">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded bg-white/10 flex items-center justify-center">
                  {selectedItem && getFileIcon(selectedItem)}
                </div>
                <div className="text-start">
                  <DialogTitle className="text-sm font-bold truncate max-w-xs">{selectedItem?.name}</DialogTitle>
                  <DialogDescription className="text-[10px] text-slate-400">
                    {selectedItem?.itemType === 'file' ? formatSize(selectedItem.size) : ''}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => selectedItem && handleDownload(selectedItem)}>
                  <Download className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setIsPreviewOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {selectedItem?.itemType === 'file' && (
                <>
                  {selectedItem.mimeType.startsWith('image/') && (
                    <div className="relative size-full">
                      <NextImage 
                        src={selectedItem.url} 
                        alt={selectedItem.name} 
                        fill 
                        className="object-contain" 
                      />
                    </div>
                  )}
                  {selectedItem.mimeType.startsWith('video/') && (
                    <video controls className="size-full object-contain rounded-lg shadow-2xl bg-black">
                      <source src={selectedItem.url} type={selectedItem.mimeType} />
                      المتصفح الخاص بك لا يدعم تشغيل الفيديو.
                    </video>
                  )}
                  {selectedItem.mimeType === 'application/pdf' && (
                    <div className="size-full flex flex-col bg-white rounded-lg overflow-hidden">
                      <object
                        data={selectedItem.url}
                        type="application/pdf"
                        className="size-full"
                      >
                        <iframe 
                          src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedItem.url)}&embedded=true`}
                          className="size-full border-none"
                          title={selectedItem.name}
                        />
                      </object>
                    </div>
                  )}
                  {!selectedItem.mimeType.startsWith('image/') && !selectedItem.mimeType.startsWith('video/') && selectedItem.mimeType !== 'application/pdf' && (
                    <div className="text-center text-white space-y-4">
                      <div className="size-24 rounded-3xl bg-white/5 flex items-center justify-center mx-auto">
                        <File className="size-12 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">لا توجد معاينة متاحة</h4>
                        <p className="text-sm text-slate-400">قم بتحميل الملف لعرض محتواه.</p>
                      </div>
                      <Button onClick={() => selectedItem && handleDownload(selectedItem)}>
                        تحميل الملف الآن
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
