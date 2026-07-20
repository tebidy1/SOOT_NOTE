import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const updateItems = [
    {
        imgSrc: "https://picsum.photos/seed/update1/400/250",
        title: "أرامكس توسع عملياتها في أوروبا",
        date: "25 أكتوبر 2023",
        description: "افتتاح مركز لوجستي جديد في فرانكفورت لتعزيز خدمات الشحن السريع.",
        href: "#"
    },
    {
        imgSrc: "https://picsum.photos/seed/update2/400/250",
        title: "تقنيات الذكاء الاصطناعي في خدمة العملاء",
        date: "18 أكتوبر 2023",
        description: "إطلاق مساعد افتراضي جديد لتقديم دعم فوري على مدار الساعة.",
        href: "#"
    },
    {
        imgSrc: "https://picsum.photos/seed/update3/400/250",
        title: "مبادرة أرامكس للاستدامة",
        date: "12 أكتوبر 2023",
        description: "التحول إلى أسطول من المركبات الكهربائية لتقليل البصمة الكربونية.",
        href: "#"
    }
]

export function LatestUpdates() {
    return (
        <section className="py-20" dir="rtl">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">أحدث المواكبات</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {updateItems.map((item, index) => (
                         <div key={index} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                            <Link href={item.href}>
                                <Image src={item.imgSrc} alt={item.title} width={400} height={250} className="w-full h-48 object-cover" data-ai-hint="logistics shipment" />
                                <div className="p-6">
                                    <p className="text-xs text-gray-500 mb-2">{item.date}</p>
                                    <h3 className="font-bold text-lg mb-3">{item.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{item.description}</p>
                                    <span className="font-semibold text-primary flex items-center gap-2">
                                        اقرأ المزيد <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                                    </span>
                                </div>
                            </Link>
                         </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
