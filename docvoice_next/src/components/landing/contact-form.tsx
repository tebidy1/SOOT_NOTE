import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import Image from "next/image";

export function ContactForm() {
    return (
        <section className="py-20" dir="rtl">
            <div className="container mx-auto px-6">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">كيف يمكننا المساعدة؟</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Image src="https://picsum.photos/seed/contact-us/500/600" alt="Contact us" width={500} height={600} className="rounded-lg" data-ai-hint="woman call center" />
                    </div>
                    <form className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">الاسم</Label>
                                <Input id="name" placeholder="اسمك الكامل" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input id="email" type="email" placeholder="email@example.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">الموضوع</Label>
                            <Input id="subject" placeholder="مثال: استفسار عن شحنة" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">الرسالة</Label>
                            <Textarea id="message" placeholder="اكتب رسالتك هنا..." rows={5} />
                        </div>
                        <Button size="lg" className="w-full">إرسال رسالة</Button>
                    </form>
                </div>
            </div>
        </section>
    );
}
