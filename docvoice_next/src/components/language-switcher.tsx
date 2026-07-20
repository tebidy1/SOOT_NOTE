'use client';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Check, Languages } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
        <Button variant="ghost" className="gap-2">
            <Languages className="h-5 w-5 text-muted-foreground" />
        </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
            <Languages className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-semibold">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale('en')} className="gap-3">
          <span role="img" aria-label="USA Flag">🇺🇸</span>
          <span className="flex-1">English</span>
          {locale === 'en' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('ar')} className="gap-3">
          <span role="img" aria-label="Saudi Arabia Flag">🇸🇦</span>
          <span className="flex-1">العربية</span>
          {locale === 'ar' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
