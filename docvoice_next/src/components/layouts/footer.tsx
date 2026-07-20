'use client';

import { Facebook, Instagram, Linkedin, Youtube, X } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';

// Using a path for TikTok icon since it's not in lucide-react
const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.01.96-.02 1.92-.01 2.88.17 2.13-.3 4.36-1.84 5.9-1.54 1.54-3.75 2.29-5.91 1.79-2.17-.5-3.88-2.22-4.38-4.38-.5-2.17.29-4.38 1.84-5.91C7.42 12.87 9.62 12.12 11.8 12.62V0h.725z" />
    </svg>
);

const socialLinks = [
    { name: 'TikTok', icon: TikTokIcon, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'X', icon: X, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'Facebook', icon: Facebook, href: '#' },
];

const footerLinkGroups = [
  {
    title: 'المنتج',
    links: [
      { label: 'المميزات', href: '#features' },
      { label: 'الأسعار', href: '#pricing' },
      { label: 'تحديثات النظام', href: '#' },
      { label: 'الأمان المتقدم', href: '#' },
    ],
  },
  {
    title: 'الحلول',
    links: [
      { label: 'التدوين الصوتي', href: '#' },
      { label: 'إدارة الملاحظات', href: '#' },
      { label: 'تنظيم المهام', href: '#' },
      { label: 'التعاون الجماعي', href: '#' },
    ],
  },
  {
    title: 'الدعم',
    links: [
      { label: 'مركز المساعدة', href: '/admin/support' },
      { label: 'تواصل معنا', href: '#contact' },
      { label: 'دليل المطورين', href: '#' },
      { label: 'الأسئلة الشائعة', href: '/admin/support' },
    ],
  },
  {
    title: 'قانوني',
    links: [
      { label: 'الشروط والأحكام', href: '#' },
      { label: 'سياسة الخصوصية', href: '#' },
      { label: 'حقوق الملكية', href: '#' },
      { label: 'اتفاقية الاستخدام', href: '#' },
    ],
  },
];

export function Footer() {
    const { t } = useI18n();
    return (
        <footer className="bg-slate-950 text-white border-t border-white/5" dir="rtl">
            <div className="container mx-auto px-6 lg:px-8 py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-12 gap-x-8">
                    <div className="col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-2xl text-primary-foreground">note_stack</span>
                            </div>
                            <span className="text-2xl font-black italic tracking-tighter text-white">{t.aramex}</span>
                        </div>
                        <p className="text-slate-400 text-base leading-relaxed max-w-sm">
                            المنصة الرائدة للتدوين الصوتي الذكي وتنظيم الملاحظات. نجمع بين التكنولوجيا والخبرة لنصل بإنتاجيتك إلى آفاق جديدة.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map(social => (
                                <Link key={social.name} href={social.href} className="text-slate-500 hover:text-primary transition-all duration-200 hover:scale-110 hover:-translate-y-0.5" aria-label={social.name}>
                                    <social.icon className="h-5 w-5" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {footerLinkGroups.map((group) => (
                        <div key={group.title} className="space-y-5">
                            <h3 className="font-bold text-white text-lg tracking-tight">{group.title}</h3>
                            <ul className="space-y-3">
                                {group.links.map(link => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors flex items-center group">
                                            <span className="w-0 group-hover:w-2 h-[1px] bg-primary transition-all mr-0 group-hover:mr-2"></span>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <p>© 2026 {t.aramex}. جميع الحقوق محفوظة.</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">جميع الأنظمة تعمل بكفاءة</span>
                        </div>
                        <div className="flex gap-6">
                            <Link href="#" className="text-xs text-slate-500 hover:text-white transition-colors">سياسة الأمان</Link>
                            <Link href="#" className="text-xs text-slate-500 hover:text-white transition-colors">إمكانية الوصول</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}