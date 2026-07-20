import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Headset, Mail, Send } from "lucide-react";

export function Hero() {
  return (
    <section className="bg-gray-50/50 dark:bg-gray-900/20 pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1" dir="rtl">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              تتبع شحناتك
            </h1>
            <div className="flex items-center gap-2 mb-6">
              <Input
                type="text"
                placeholder="أدخل رقم تتبع الشحنة هنا"
                className="h-14 text-lg border-2 border-gray-200 focus:border-primary"
              />
              <Button size="lg" className="h-14 px-6 bg-primary hover:bg-red-700">
                تتبع
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              يمكنك تتبع ما يصل إلى 10 شحنات في المرة الواحدة. افصل بين كل رقم
              تتبع بفاصلة.
            </p>
          </div>
          <div className="order-1 md:order-2">
            <Image
              src="https://picsum.photos/seed/courier-hero/600/400"
              alt="Aramex Courier"
              width={600}
              height={400}
              className="rounded-lg"
              data-ai-hint="courier package"
            />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Headset className="mx-auto h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">طلب استشارة</h3>
          </Card>
          <Card className="p-6 bg-primary text-white shadow-xl">
            <Send className="mx-auto h-8 w-8 mb-2" />
            <h3 className="font-semibold">إرسال شحنة</h3>
            <p className="text-xs opacity-80">ابدأ بشحناتك في دقائق معدودة</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Mail className="mx-auto h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">طباعة الملصق</h3>
          </Card>
        </div>
      </div>
    </section>
  );
}
