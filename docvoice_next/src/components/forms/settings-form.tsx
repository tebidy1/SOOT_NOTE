"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadCloud, Check, X } from 'lucide-react';
import { useEffect, useCallback, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/providers/i18n-provider';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { SettingsFormSkeleton } from '@/components/settings/settings-form-skeleton';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/image-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useApiForm } from '@/components/ui/api-form';
import { FormApiError } from '@/components/ui/form-api-error';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/ui/form/index';

const settingsSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('A valid email is required.'),
    phone: z.string().min(9, 'A valid phone number is required.').optional().or(z.literal('')),
    photoURL: z.string().url().optional().or(z.literal('')),
    notifications: z.object({
        sms: z.boolean().default(false),
        email: z.boolean().default(false),
    }).default({ sms: true, email: false }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm() {
    const { user, loading, updateUser } = useAuth();
    const { t } = useI18n();

    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    const { form, apiError, clearApiError, handleApiError } = useApiForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            photoURL: '',
            notifications: {
                sms: true,
                email: false,
            }
        },
        resolver: zodResolver(settingsSchema),
    });

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                photoURL: user.photoURL || '',
                notifications: user.notifications || { sms: true, email: false },
            });
        }
    }, [user, form]);

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
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
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
                    form.setValue('photoURL', croppedImage, { shouldValidate: true });
                    setIsCropModalOpen(false);
                    setImageToCrop(null);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    const onSubmit = async (data: SettingsFormValues) => {
        if (!user) return;
        try {
            clearApiError();
            await updateUser({
                name: data.name,
                email: data.email,
                photoURL: data.photoURL,
                phone: data.phone,
                notifications: data.notifications,
            });
        } catch (error) {
            handleApiError(error);
        }
    };

    if (loading) {
        return <SettingsFormSkeleton />
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormApiError message={apiError} onDismiss={clearApiError} />
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>{t.profile}</CardTitle>
                            <CardDescription>{t.profileDesc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row items-center gap-10">
                                <div className="flex flex-col items-center gap-4">
                                    <div {...getRootProps()} className={cn(
                                        "relative group rounded-full cursor-pointer border-4 border-dashed transition-all overflow-hidden bg-muted",
                                        isDragActive ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-800"
                                    )}>
                                        <input {...getInputProps()} />
                                        <Avatar className="h-40 w-40">
                                            <AvatarImage src={form.watch('photoURL') || undefined} alt={form.watch('name')} className="object-cover" />
                                            <AvatarFallback className="text-4xl">{form.watch('name')?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <UploadCloud className="h-10 w-10 text-white mb-2" />
                                            <span className="text-white text-xs font-bold uppercase tracking-wider">Change Photo</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic text-center max-w-[200px]">
                                        Your profile picture and name will be visible to couriers during deliveries.
                                    </p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput
                                    control={form.control}
                                    name="email"
                                    label={t.email}
                                    type="email"
                                    className="h-11"
                                />
                                <FormInput
                                    control={form.control}
                                    name="phone"
                                    label={t.phoneNumber}
                                    type="tel"
                                    className="h-11"
                                />
                            </div>
                             <Separator />
                             <div>
                                <Label className="text-base font-bold">{t.notificationPreferences}</Label>
                                <div className="space-y-3 mt-4">
                                     <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <Checkbox 
                                            id="sms-notifications" 
                                            checked={form.watch('notifications.sms')}
                                            onCheckedChange={(checked) => form.setValue('notifications.sms', !!checked, { shouldValidate: true })}
                                        />
                                        <Label htmlFor="sms-notifications" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                            {t.smsNotifications}
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <Checkbox 
                                            id="email-notifications" 
                                            checked={form.watch('notifications.email')}
                                            onCheckedChange={(checked) => form.setValue('notifications.email', !!checked, { shouldValidate: true })}
                                        />
                                        <Label htmlFor="email-notifications" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                            {t.emailNotifications}
                                        </Label>
                                    </div>
                                </div>
                             </div>
                        </CardContent>
                    </Card>

                    <div className="mt-8 flex justify-end">
                        <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="px-10 h-14 text-lg rounded-xl font-bold shadow-lg shadow-primary/20">
                            {form.formState.isSubmitting ? t.saving : t.saveSettings}
                        </Button>
                    </div>
                </form>
            </Form>

            <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none">
                    <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b">
                        <DialogTitle className="text-xl font-black">Adjust Photo</DialogTitle>
                    </DialogHeader>
                    <div className="relative h-[400px] w-full bg-slate-200">
                        {imageToCrop && (
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </div>
                    <div className="p-6 space-y-6 bg-white dark:bg-slate-900">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-bold">
                                <span>Zoom</span>
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
                            >
                                <X className="size-4 me-2" />
                                Cancel
                            </Button>
                            <Button 
                                className="flex-1 h-12 rounded-xl font-bold" 
                                onClick={handleSaveCrop}
                            >
                                <Check className="size-4 me-2" />
                                Save Photo
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
