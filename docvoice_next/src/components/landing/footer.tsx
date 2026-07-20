import { Facebook, Instagram, Linkedin, Twitter, Youtube, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
    title: 'عن أرامكس',
    links: [
      { label: 'علاقات المستثمرين', href: '#' },
      { label: 'الاستدامة', href: '#' },
      { label: 'الامتيازات التجارية', href: '#' },
      { label: 'MyUS', href: '#' },
      { label: 'نبذة عن أرامكس', href: '#' },
    ],
  },
  {
    title: 'روابط مفيدة',
    links: [
      { label: 'المسؤولية القانونية', href: '#' },
      { label: 'الشروط والأحكام', href: '#' },
      { label: 'بوابة الإبلاغ عن المخالفات', href: '#' },
      { label: 'رسوم إضافية للمنطقة النائية', href: '#' },
      { label: 'رسوم التوقيع الإضافية', href: '#' },
      { label: 'الرسوم الإضافية للوقود', href: '#' },
    ],
  },
  {
    title: 'التواصل',
    links: [
      { label: 'الوظائف', href: '#' },
      { label: 'أرامكس برس', href: '#' },
      { label: 'بلوجستكس', href: '#' },
      { label: 'مركز المساعدة والدعم', href: '#' },
    ],
  },
  {
    title: 'مركز حلول المطورين',
    links: [
      { label: 'واجهات برمجة التطبيقات', href: '#' },
      { label: 'منصة Sootnote', href: '#' },
      { label: 'موقع أرامكس الإلكتروني', href: '#' },
    ],
  },
];

export function Footer() {
    return (
        <footer className="bg-slate-900 text-white" dir="rtl">
            <div className="container mx-auto px-6 lg:px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-10 gap-x-8">
                    {footerLinkGroups.map((group) => (
                        <div key={group.title} className="space-y-4">
                            <h3 className="font-bold text-primary">{group.title}</h3>
                            <ul className="space-y-3">
                                {group.links.map(link => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="text-sm text-slate-300 hover:text-white transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                     <div className="col-span-2 md:col-span-4 lg:col-span-1 lg:justify-self-end text-start lg:text-end">
                        <div className="flex items-center gap-2 justify-start lg:justify-end">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl text-slate-900">note_stack</span>
                            </div>
                            <span className="text-xl font-black italic text-white">Sootnote</span>
                        </div>
                    </div>
                </div>

                <div className="mt-16 border-t border-slate-700 pt-8 flex flex-col md:flex-row-reverse items-center justify-between gap-6">
                     <div className="flex flex-wrap gap-5">
                        {socialLinks.map(social => (
                            <Link key={social.name} href={social.href} className="text-slate-400 hover:text-white" aria-label={social.name}>
                                <social.icon className="h-6 w-6" />
                            </Link>
                        ))}
                    </div>
                    <p className="text-sm text-slate-400">© Sootnote 2026 جميع الحقوق محفوظة.</p>
                </div>
            </div>
        </footer>
    );
}
