'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AccountSidebar } from '@/components/account-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, ChevronRight, Plus } from 'lucide-react';
import { AddEmailModal } from '@/components/add-email-modal';
import { useAuth } from '@/components/auth/auth-provider';
import { showSuccess, showError } from '@/lib/notification.service';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/api-error';

export default function EditProfileDesktopPage() {
    const { user, setUser } = useAuth();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState("https://picsum.photos/seed/aramex-user/128/128");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await clientService.getCurrentUser();
            const userData = response || user;

            if (userData) {
                const nameParts = (userData.name || '').split(' ');
                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone_number || '',
                });
                if (userData.avatar) {
                    setAvatarUrl(userData.avatar);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showError('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await clientService.updateProfile({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                photoURL: avatarUrl,
            });
            showSuccess('تم حفظ التغييرات بنجاح');
            if (user) {
                setUser({ ...user, name: formData.name, email: formData.email });
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            const apiError = error instanceof ApiError ? error : ApiError.fromAxiosError(error);
            showError(apiError.message || 'فشل في حفظ التغييرات');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 max-w-4xl">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <div className="p-8 space-y-10">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <Skeleton className="w-32 h-32 rounded-full" />
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <AddEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />

            <AccountSidebar />

            <div className="flex-1 max-w-4xl">
                <nav className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-6">
                    <span className="hover:text-gray-900 cursor-pointer">ملفي الشخصي</span>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-primary">تعديل الملف</span>
                </nav>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-900">تعديل الملف</h1>
                        <p className="text-gray-500 mt-1">إدارة معلوماتك الشخصية وتفاصيل الاتصال.</p>
                    </div>

                    <div className="p-8 space-y-10">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <Avatar className="w-32 h-32 border-4 border-gray-50 shadow-inner cursor-pointer" onClick={handleAvatarClick}>
                                    <AvatarImage src={avatarUrl} alt="User" />
                                    <AvatarFallback className="bg-gray-100 text-2xl font-bold text-gray-400">
                                        {formData.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleAvatarClick}>
                                    <Camera className="h-8 w-8 text-white" />
                                </div>
                                <button type="button" onClick={handleAvatarClick} className="hidden absolute bottom-0 end-0 h-10 w-10 bg-primary text-primary-foreground rounded-full border-4 border-white md:flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                                    <Camera className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="space-y-3 text-center md:text-left">
                                <h3 className="text-lg font-semibold text-gray-900">صورة الملف</h3>
                                <p className="text-sm text-gray-500 max-w-xs">
                                    قم برفع صورة جديدة لتخصيص حسابك. يُنصح بحجم 200x200 بكسل كحد أدنى.
                                </p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <button onClick={handleAvatarClick} className="text-sm font-bold text-primary hover:underline">رفع جديد</button>
                                    <button onClick={() => setAvatarUrl("https://picsum.photos/seed/aramex-user/128/128")} className="text-sm font-bold text-gray-400 hover:text-red-500">إزالة</button>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold text-gray-700">الاسم الكامل</Label>
                                <Input
                                    id="name"
                                    placeholder="أدخل اسمك"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="h-12 border-gray-200 focus:border-primary focus:ring-primary/10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="email" className="text-sm font-bold text-gray-700">البريد الإلكتروني</Label>
                                    <button
                                        onClick={() => setIsEmailModalOpen(true)}
                                        className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
                                    >
                                        <Plus className="h-3 w-3" /> إضافة بديل
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="h-12 border-gray-200 focus:border-primary focus:ring-primary/10 rounded-xl pe-28"
                                    />
                                    {formData.email && (
                                        <div className="absolute end-3 top-1/2 -translate-y-1/2">
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-tighter">موثق</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-bold text-gray-700">رقم الهاتف</Label>
                                <div className="flex gap-2">
                                    <div className="w-24 h-12 flex items-center justify-center border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold cursor-pointer hover:bg-gray-100">
                                        <span className="ms-2">🇸🇩</span>
                                        <span>+249</span>
                                    </div>
                                    <Input
                                        id="phone"
                                        placeholder="9XXXXXXXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="flex-1 h-12 border-gray-200 focus:border-primary focus:ring-primary/10 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full sm:w-auto h-14 px-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg shadow-md transition-all active:scale-95"
                            >
                                {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                            </Button>
                            <Button variant="ghost" className="w-full sm:w-auto h-14 px-10 rounded-xl font-bold text-gray-500 hover:bg-gray-50">
                                إلغاء
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
