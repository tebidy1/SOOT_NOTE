'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { useI18n } from "@/providers/i18n-provider";
import { settingsService } from "@/lib/services/settings.service";
import { Building, Mail, Phone, ShieldAlert, Truck, UploadCloud, Check, X, DollarSign } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import Cropper from 'react-easy-crop';
import { getCroppedImg, dataURLtoFile } from '@/lib/image-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApiForm } from '@/components/ui/api-form';
import { FormApiError } from '@/components/ui/form-api-error';
import { Form, FormInput, FormSelect, FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form/index';
import { Input } from '@/components/ui/input';

const settingsSchema = z.object({
    app_name: z.string().min(1, 'اسم التطبيق مطلوب'),
    app_version_mobile: z.string().min(1, 'إصدار التطبيق مطلوب'),
    max_shipment_weight: z.string().min(1, 'الوزن الأقصى مطلوب'),
    support_email: z.string().email('بريد إلكتروني غير صالح'),
    support_phone: z.string().min(1, 'رقم الهاتف مطلوب'),
    currency: z.string().min(1, 'العملة مطلوبة'),
    maintenance_enabled: z.boolean().default(false),
    force_update_mobile: z.boolean().default(false),
    logo: z.string().nullable().default(null),
});

const currencyOptions = [
    { value: 'USD', label: 'دولار أمريكي ($)', icon: <span className="text-green-600 font-bold">$</span> },
    { value: 'SAR', label: 'ريال سعودي (﷼)', icon: <span className="text-green-600 font-bold">﷼</span> },
    { value: 'SDG', label: 'جنيه سوداني (ج.س)', icon: <span className="text-green-600 font-bold">ج.س</span> },
];

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function ApplicationSettingsForm() {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    
    const { form, apiError, clearApiError, handleApiError } = useApiForm({
        defaultValues: {
            app_name: 'TrackItRight',
            app_version_mobile: '1.0.0',
            max_shipment_weight: '50',
            support_email: 'support@trackitright.com',
            support_phone: '+249123456789',
            currency: 'USD',
            maintenance_enabled: false,
            force_update_mobile: false,
            logo: null,
        },
        resolver: zodResolver(settingsSchema),
    });
    
    const logoUrl = form.watch('logo');
    
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await settingsService.getAppSettings();
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
                const logoPath = settings.logo_url || settings.logo;
                const fullLogoUrl = logoPath ? `${baseUrl.replace(/\/$/, '')}/${logoPath.replace(/^\//, '')}` : null;
                
                form.reset({
                    app_name: settings.app_name || 'TrackItRight',
                    app_version_mobile: settings.app_version_mobile || '1.0.0',
                    max_shipment_weight: String(settings.max_shipment_weight || '50'),
                    support_email: settings.support_email || 'support@trackitright.com',
                    support_phone: settings.support_phone || '+249123456789',
                    currency: settings.currency || 'USD',
                    maintenance_enabled: settings.maintenance_enabled === '1' || settings.maintenance_enabled === true,
                    force_update_mobile: settings.force_update_mobile === '1' || settings.force_update_mobile === true,
                    logo: fullLogoUrl,
                });
            } catch (error) {
                console.error('فشل تحميل الإعدادات');
            } finally {
                setInitialLoading(false);
            }
        };
        loadSettings();
    }, [form]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result as string);
                setIsCropModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.svg'] },
        multiple: false,
    });

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSaveCrop = async () => {
        if (imageToCrop && croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
                if (croppedImage) {
                    form.setValue('logo', croppedImage, { shouldValidate: true });
                    setIsCropModalOpen(false);
                    setImageToCrop(null);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleSave = async (data: Record<string, any>) => {
        setLoading(true);
        try {
            let logoFile: File | null = null;
            if (data.logo && data.logo.startsWith('data:')) {
                logoFile = dataURLtoFile(data.logo, 'logo.png');
            }
            
            await settingsService.updateAppSettings({
                app_name: data.app_name,
                app_version_mobile: data.app_version_mobile,
                max_shipment_weight: parseFloat(data.max_shipment_weight),
                support_email: data.support_email,
                support_phone: data.support_phone,
                currency: data.currency,
                maintenance_enabled: data.maintenance_enabled,
                force_update_mobile: data.force_update_mobile,
                logo: logoFile,
            });
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 gap-8">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <FormApiError message={apiError} onDismiss={clearApiError} />
                <div className="grid grid-cols-1 gap-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building className="size-5 text-primary" />
                                <CardTitle>{t.branding}</CardTitle>
                            </div>
                            <CardDescription>{t.brandingDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-base font-bold">{t.logo}</Label>
                                    <p className="text-sm text-muted-foreground italic">
                                        سيظهر هذا الشعار والاسم في جميع التقارير، الفواتير، ورسائل البريد الإلكتروني.
                                    </p>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div {...getRootProps()} className={cn(
                                        "relative size-48 rounded-2xl cursor-pointer border-4 border-dashed transition-all overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800",
                                        isDragActive ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                                    )}>
                                        <input {...getInputProps()} />
                                        {logoUrl ? (
                                            <div className="relative size-full">
                                                <Image src={logoUrl} alt="Logo Preview" fill className="object-contain p-4" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center p-4">
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                                                    <UploadCloud className="size-6 text-primary" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 uppercase">{t.uploadClick}</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <UploadCloud className="size-8 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4 text-center md:text-start">
                                        <p className="text-lg font-bold">{t.siteName}</p>
                                        <FormInput
                                            control={form.control}
                                            name="app_name"
                                            hideLabel
                                            className="max-w-md mx-auto md:mx-0 h-12 text-lg"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => form.setValue('logo', null)}
                                            disabled={!logoUrl}
                                            type="button"
                                        >
                                            إزالة الشعار الحالي
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="size-5 text-primary" />
                                <CardTitle>{t.appGroup}</CardTitle>
                            </div>
                            <CardDescription>{t.appGroupDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div className="space-y-0.5 text-start">
                                    <Label className="text-base font-bold">{t.maintenanceMode}</Label>
                                    <p className="text-sm text-muted-foreground">{t.maintenanceModeDesc}</p>
                                </div>
                                <Switch 
                                    checked={form.watch('maintenance_enabled')}
                                    onCheckedChange={(checked) => form.setValue('maintenance_enabled', !!checked, { shouldValidate: true })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormInput
                                    control={form.control}
                                    name="app_version_mobile"
                                    label={t.mobileAppVersion}
                                    className="h-11"
                                />
                                <div className="flex items-center gap-3 pt-8 justify-start">
                                    <Switch 
                                        id="forceUpdate"
                                        checked={form.watch('force_update_mobile')}
                                        onCheckedChange={(checked) => form.setValue('force_update_mobile', !!checked, { shouldValidate: true })}
                                    />
                                    <Label htmlFor="forceUpdate" className="font-bold">{t.forceMobileUpdate}</Label>
                                </div>
                            </div>

                            <Separator />

                            <FormInput
                                control={form.control}
                                name="max_shipment_weight"
                                label={t.maxShipmentWeight}
                                type="number"
                                className="h-11"
                            />
                            <p className="text-xs text-muted-foreground">{t.maxShipmentWeightDesc}</p>

                            <FormSelect
                                control={form.control}
                                name="currency"
                                label="العملة"
                                placeholder="اختر العملة..."
                                options={currencyOptions}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Mail className="size-5 text-primary" />
                                <CardTitle>{t.contactGroup}</CardTitle>
                            </div>
                            <CardDescription>{t.contactGroupDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="support_email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">{t.supportEmail}</FormLabel>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input className="ps-10 h-11" {...field} />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="support_phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">{t.supportPhone}</FormLabel>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <FormControl>
                                                <Input className="ps-10 h-11" {...field} />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-4 pb-12">
                    <Button 
                        size="lg" 
                        className="px-12 h-14 text-lg font-bold rounded-xl shadow-xl shadow-primary/20" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? t.saving : t.saveChanges}
                    </Button>
                </div>
            </form>

            <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none">
                    <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b">
                        <DialogTitle className="text-xl font-black">ضبط شعار الشركة</DialogTitle>
                    </DialogHeader>
                    <div className="relative h-[400px] w-full bg-slate-200">
                        {imageToCrop && (
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="rect"
                                showGrid={true}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </div>
                    <div className="p-6 space-y-6 bg-white dark:bg-slate-900">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-bold">
                                <span>التكبير</span>
                                <span className="text-primary">{Math.round(zoom * 100)}%</span>
                            </div>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(vals) => setZoom(vals[0])}
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 h-12 rounded-xl font-bold" 
                                onClick={() => setIsCropModalOpen(false)}
                                type="button"
                            >
                                <X className="size-4 me-2" />
                                إلغاء
                            </Button>
                            <Button 
                                className="flex-1 h-12 rounded-xl font-bold" 
                                onClick={handleSaveCrop}
                                type="button"
                            >
                                <Check className="size-4 me-2" />
                                حفظ الشعار
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Form>
    );
}
