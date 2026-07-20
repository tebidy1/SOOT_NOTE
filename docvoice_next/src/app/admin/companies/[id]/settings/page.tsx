'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { companyService } from '@/lib/services/company.service';
import { useI18n } from '@/providers/i18n-provider';
import { showError, showSuccess } from '@/lib/notification.service';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function CompanySettingsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const companyId = params.id as string;

  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [groqModel, setGroqModel] = useState('whisper-large-v3-turbo');
  const [specialty, setSpecialty] = useState('');
  const [prompt, setPrompt] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['company-settings', companyId],
    queryFn: () => companyService.getCompanySettings(companyId),
    enabled: !!companyId,
  });

  useEffect(() => {
    if (response) {
      const settings = response?.payload?.settings || response?.settings || response?.payload || response;
      if (settings) {
        setGroqKey(settings.groq_api_key || '');
        setGeminiKey(settings.gemini_api_key || '');
        setGroqModel(settings.groq_model_pref || 'whisper-large-v3-turbo');
        setSpecialty(settings.specialty || '');
        setPrompt(settings.global_ai_prompt || '');
      }
    }
  }, [response]);

  const mutation = useMutation({
    mutationFn: (data: any) => companyService.updateCompanySettings(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings', companyId] });
      showSuccess(t.settingsSaved);
    },
    onError: (error: any) => {
      showError(error?.message || t.settingsSaveFailed);
    },
  });

  const handleSave = () => {
    mutation.mutate({
      groq_api_key: groqKey,
      gemini_api_key: geminiKey,
      groq_model_pref: groqModel,
      specialty: specialty,
      global_ai_prompt: prompt,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.companySettings}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-body">{t.companySettingsDesc}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="groq_key">{t.groqApiKey}</Label>
              <Input
                id="groq_key"
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
              />
            </div>

            <div className="space-y-2">
              <Label>{t.transcriptionModel}</Label>
              <RadioGroup value={groqModel} onValueChange={setGroqModel}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="whisper-large-v3" id="precision" />
                  <Label htmlFor="precision">{t.highPrecision}</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="whisper-large-v3-turbo" id="turbo" />
                  <Label htmlFor="turbo">{t.turbo}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gemini_key">{t.geminiApiKey}</Label>
              <Input
                id="gemini_key"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">{t.specialty}</Label>
              <Input
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Cardiology"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">{t.globalAiPrompt}</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Always use British spelling..."
                rows={4}
              />
            </div>

            <Button onClick={handleSave} disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.saving}</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> {t.saveConfiguration}</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
