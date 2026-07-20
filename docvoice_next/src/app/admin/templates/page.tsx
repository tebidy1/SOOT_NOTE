'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DeleteAlertDialog } from '@/components/shared/delete-alert-dialog';
import { templateService } from '@/lib/services/template.service';
import { medicalDepartmentService } from '@/lib/services/medical-department.service';
import { useI18n } from '@/providers/i18n-provider';
import { showError, showSuccess } from '@/lib/notification.service';
import { Plus, Edit, Trash2, Search, Loader2, PlusCircle, MinusCircle } from 'lucide-react';

export default function TemplatesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editTrigger, setEditTrigger] = useState('');
  const [editContent, setEditContent] = useState('');

  const { data: deptsResponse, isLoading: deptsLoading } = useQuery({
    queryKey: ['medical-departments'],
    queryFn: () => medicalDepartmentService.getDepartments(),
  });

  const departments = useMemo(() => {
    const raw = deptsResponse?.data || deptsResponse || [];
    return Array.isArray(raw) ? raw : [];
  }, [deptsResponse]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplates({ per_page: 1000 }),
  });

  const allMacros = useMemo(() => {
    const raw = response?.data || response || [];
    return Array.isArray(raw) ? raw : [];
  }, [response]);

  const isAssignedToDept = (macro: any, deptId: number): boolean => {
    const depts = macro.medical_departments || macro.medicalDepartments || [];
    return depts.some((d: any) => d.id === deptId);
  };

  const availableMacros = useMemo(() => {
    if (!selectedDeptId) return [];
    return allMacros.filter((m: any) => !isAssignedToDept(m, selectedDeptId));
  }, [allMacros, selectedDeptId]);

  const assignedMacros = useMemo(() => {
    if (!selectedDeptId) return [];
    return allMacros.filter((m: any) => isAssignedToDept(m, selectedDeptId));
  }, [allMacros, selectedDeptId]);

  const filteredAvailable = useMemo(() => {
    if (!searchQuery) return availableMacros;
    const q = searchQuery.toLowerCase();
    return availableMacros.filter((m: any) =>
      m.trigger?.toLowerCase().includes(q) || m.content?.toLowerCase().includes(q)
    );
  }, [availableMacros, searchQuery]);

  const filteredAssigned = useMemo(() => {
    if (!searchQuery) return assignedMacros;
    const q = searchQuery.toLowerCase();
    return assignedMacros.filter((m: any) =>
      m.trigger?.toLowerCase().includes(q) || m.content?.toLowerCase().includes(q)
    );
  }, [assignedMacros, searchQuery]);

  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id?: number; data: any }) => {
      if (id) return templateService.updateTemplate(id, data);
      return templateService.createTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditDialogOpen(false);
      setEditingTemplate(null);
      showSuccess(t.templateUpdated);
    },
    onError: (error: any) => showError(error?.message || 'Error saving template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => templateService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleteDialogOpen(false);
      showSuccess(t.templateDeleted);
    },
    onError: (error: any) => showError(error?.message || 'Error deleting template'),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ macro, assign }: { macro: any; assign: boolean }) => {
      const currentDeptIds = (macro.medical_departments || macro.medicalDepartments || []).map((d: any) => d.id);
      let newDeptIds: number[];

      if (assign && selectedDeptId && !currentDeptIds.includes(selectedDeptId)) {
        newDeptIds = [...currentDeptIds, selectedDeptId];
      } else if (!assign && selectedDeptId) {
        newDeptIds = currentDeptIds.filter((id: number) => id !== selectedDeptId);
      } else {
        return;
      }

      return templateService.assignDepartments(macro.id, newDeptIds);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
    onError: (error: any) => showError(error?.message || 'Error updating assignment'),
  });

  const handleAdd = () => {
    setEditingTemplate(null);
    setEditTrigger('');
    setEditContent('');
    setEditDialogOpen(true);
  };

  const handleEdit = (macro: any) => {
    setEditingTemplate(macro);
    setEditTrigger(macro.trigger);
    setEditContent(macro.content);
    setEditDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!editTrigger.trim() || !editContent.trim()) return;
    saveMutation.mutate({
      id: editingTemplate?.id,
      data: {
        trigger: editTrigger.trim(),
        content: editContent.trim(),
        is_ai_macro: true,
        medical_department_ids: (editingTemplate?.medical_departments || editingTemplate?.medicalDepartments || []).map((d: any) => d.id),
      },
    });
  };

  const selectedDept = departments.find((d: any) => d.id === selectedDeptId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t.templatesLibrary}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-body">{t.templatesLibraryDesc}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t.addTemplate}
        </Button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchTemplates}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Panel - Departments */}
        <Card className="w-64 shrink-0">
          <CardHeader>
            <CardTitle className="text-sm">{t.departments}</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {deptsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                departments.map((dept: any) => {
                  const count = allMacros.filter((m: any) => isAssignedToDept(m, dept.id)).length;
                  const isActive = selectedDeptId === dept.id;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {dept.icon && <span className="material-symbols-outlined text-xl">{dept.icon}</span>}
                      <span className="flex-1 text-start font-medium">{dept.name_ar}</span>
                      {count > 0 && (
                        <Badge variant={isActive ? 'outline' : 'secondary'} className="text-xs">
                          {count}
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panels - Templates */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Available Templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">{t.availableTemplates}</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : selectedDeptId === null ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t.selectDepartment}
                </div>
              ) : filteredAvailable.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t.noTemplatesFound}
                </div>
              ) : (
                <div className="space-y-2 p-2 max-h-[600px] overflow-y-auto">
                  {filteredAvailable.map((macro: any) => (
                    <div
                      key={macro.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-accent/50 transition-colors group"
                    >
                      <button
                        onClick={() => assignMutation.mutate({ macro, assign: true })}
                        className="mt-1 text-green-600 hover:text-green-700"
                        title={t.assignToDepartment}
                      >
                        <PlusCircle className="h-5 w-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{macro.trigger}</p>
                        <p className="text-xs text-muted-foreground truncate">{macro.content}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(macro)} className="p-1 text-blue-600 hover:text-blue-700">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setEditingTemplate(macro); setDeleteDialogOpen(true); }}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-600">
                {selectedDept ? `${t.assignedTemplates} - ${selectedDept.name_ar}` : t.assignedTemplates}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : selectedDeptId === null ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t.selectDepartment}
                </div>
              ) : filteredAssigned.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t.noTemplatesFound}
                </div>
              ) : (
                <div className="space-y-2 p-2 max-h-[600px] overflow-y-auto">
                  {filteredAssigned.map((macro: any) => (
                    <div
                      key={macro.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-accent/50 transition-colors group"
                    >
                      <button
                        onClick={() => assignMutation.mutate({ macro, assign: false })}
                        className="mt-1 text-red-600 hover:text-red-700"
                        title={t.removeFromDepartment}
                      >
                        <MinusCircle className="h-5 w-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{macro.trigger}</p>
                        <p className="text-xs text-muted-foreground truncate">{macro.content}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(macro)} className="p-1 text-blue-600 hover:text-blue-700">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setEditingTemplate(macro); setDeleteDialogOpen(true); }}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? t.editTemplate : t.addTemplate}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trigger">{t.templateTrigger}</Label>
              <Input
                id="trigger"
                value={editTrigger}
                onChange={(e) => setEditTrigger(e.target.value)}
                placeholder={t.templateTrigger}
              />
            </div>
            <p className="text-xs text-muted-foreground italic">{t.saveFirstToAssign}</p>
            <div className="space-y-2">
              <Label htmlFor="content">{t.templateContent}</Label>
              <Textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder={t.templateContentPlaceholder}
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteAlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => deleteMutation.mutate(editingTemplate?.id)}
        isPending={deleteMutation.isPending}
        title={t.deleteTemplate}
        description={`${t.deleteTemplateConfirm} "${editingTemplate?.trigger}"؟`}
      />
    </div>
  );
}
