import { Bell, Shield, HandCoins } from "lucide-react";
import React from 'react';

const ServiceItem = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => {
    return (
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mx-auto mb-6">
                <Icon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    )
}

export function Services() {
  return (
    <section className="py-20 bg-slate-50/50 dark:bg-slate-900/20" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">شحن لا يعرف حدوداً</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
           <ServiceItem
                icon={Bell}
                title="استلام إشعارات الحالة"
                description="ابق على اطلاع دائم بحالة شحنتك من خلال إشعاراتنا الفورية عبر الرسائل القصيرة والبريد الإلكتروني."
            />
            <ServiceItem
                icon={Shield}
                title="تأمين شحنتك"
                description="احصل على راحة البال مع خيارات التأمين المتنوعة التي نقدمها لحماية شحناتك القيمة."
            />
             <ServiceItem
                icon={HandCoins}
                title="الدفع عند الاستلام"
                description="نوفر لك خيار الدفع عند استلام شحنتك لمرونة أكبر في عمليات الدفع."
            />
        </div>
      </div>
    </section>
  );
}
