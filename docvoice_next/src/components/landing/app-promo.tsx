import Image from "next/image";
import { Button } from "../ui/button";

export function AppPromo() {
  return (
    <section className="py-20" dir="rtl">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 -z-10"></div>
             <Image
                src="https://picsum.photos/seed/app-promo/600/500"
                width={600}
                height={500}
                alt="Aramex App"
                className="rounded-lg"
                data-ai-hint="delivery app phone"
            />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-4">حمّل تطبيق أرامكس</h2>
          <ul className="space-y-4 mb-8 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-2xl mt-1">&#x2713;</span>
                  <p><span className="font-bold text-gray-800 dark:text-white">تتبع فوري:</span> اعرف مكان شحنتك في أي وقت.</p>
              </li>
              <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-2xl mt-1">&#x2713;</span>
                  <p><span className="font-bold text-gray-800 dark:text-white">جدولة سهلة:</span> حدد مواعيد الاستلام والتسليم بسهولة.</p>
              </li>
              <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-2xl mt-1">&#x2713;</span>
                  <p><span className="font-bold text-gray-800 dark:text-white">دفع آمن:</span> ادفع الرسوم الجمركية والشحن مباشرة من التطبيق.</p>
              </li>
          </ul>
          <div className="flex items-center gap-4">
            <Button asChild size="lg"><a href="#"><Image src="https://picsum.photos/seed/appstore/150/50" alt="App Store" width={150} height={50} data-ai-hint="app store" /></a></Button>
            <Button asChild size="lg"><a href="#"><Image src="https://picsum.photos/seed/googleplay/150/50" alt="Google Play" width={150} height={50} data-ai-hint="google play" /></a></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
