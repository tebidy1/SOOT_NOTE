import { Button } from "../ui/button";

export function GlobalMap() {
    return (
        <section className="py-20 bg-gray-50/50 dark:bg-gray-900/20" dir="rtl">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold mb-4">نحن دائماً معك أينما كنت حول العالم!</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                    تغطي شبكتنا العالمية أكثر من 220 دولة ومنطقة، مما يضمن وصول شحناتك إلى وجهتها بأمان وسرعة. نحن نربط الأعمال والناس عبر القارات.
                </p>
                <div className="mb-10">
                    {/* Placeholder for map */}
                    <div className="h-64 w-full bg-contain bg-no-repeat bg-center" style={{backgroundImage: "url('https://raw.githubusercontent.com/firebase-studio/prototyping-shop-assets/main/aramex-world-map.png')"}}></div>
                </div>
                <Button size="lg">اعرف المزيد عن شبكتنا</Button>
            </div>
        </section>
    )
}
