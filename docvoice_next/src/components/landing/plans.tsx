import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PlanCard = ({ title, price, description, features, buttonText, highlighted }: { title: string, price: string, description: string, features: string[], buttonText: string, highlighted?: boolean }) => {
    return (
        <div className={`border p-6 rounded-lg ${highlighted ? 'border-primary' : 'border-gray-200'}`}>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-3xl font-extrabold my-4">{price}</p>
            <p className="text-gray-500 text-sm mb-6">{description}</p>
            <ul className="space-y-3 text-sm mb-8">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <Button className={`w-full ${!highlighted ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : ''}`}>{buttonText}</Button>
        </div>
    )
}


export function Plans() {
  return (
    <section className="py-20" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">خططنا</h2>
          <p className="text-gray-500">اختر الخطة التي تناسبك</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <PlanCard 
            title="الأعمال"
            price="ابدأ الآن"
            description="حلول متكاملة للشركات الصغيرة والمتوسطة والكبيرة."
            features={["شحن سريع", "تتبع متقدم", "تكامل مع المنصات", "دعم فني متخصص"]}
            buttonText="تواصل مع المبيعات"
          />
           <PlanCard 
            title="جرّب مجاناً"
            price="0 ر.س"
            description="افتح حساب أرامكس شخصي واستمتع بمجموعة من المزايا."
            features={["خصومات حصرية", "تخزين عناوين متعددة", "جدولة استلام الشحنات", "تفضيلات التوصيل"]}
            buttonText="حاول الآن"
            highlighted
          />
           <PlanCard 
            title="دولي للأفراد"
            price="احسب التكلفة"
            description="اشحن إلى أي مكان في العالم بسهولة وسرعة."
            features={["أسعار تنافسية", "توصيل من الباب للباب", "تخليص جمركي", "تأمين على الشحنات"]}
            buttonText="احسب تكلفة الشحن"
          />
        </div>
      </div>
    </section>
  );
}
