import Image from "next/image";

const logos = [
    { src: "https://raw.githubusercontent.com/firebase-studio/prototyping-shop-assets/main/aramex-partner-1.png", alt: "Maxtech" },
    { src: "https://raw.githubusercontent.com/firebase-studio/prototyping-shop-assets/main/aramex-partner-2.png", alt: "Golden" },
    { src: "https://raw.githubusercontent.com/firebase-studio/prototyping-shop-assets/main/aramex-partner-3.png", alt: "Hiltres" },
    { src: "https://raw.githubusercontent.com/firebase-studio/prototyping-shop-assets/main/aramex-partner-4.png", alt: "Statue" },
    { src: "https://raw.githubusercontent.com/firebase-studio/prototyping-shop-assets/main/aramex-partner-5.png", alt: "World Wide" },
];

export function Partners() {
    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                <div className="flex justify-around items-center flex-wrap gap-8">
                    {logos.map((logo, index) => (
                        <Image key={index} src={logo.src} alt={logo.alt} width={100} height={100} className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition" />
                    ))}
                </div>
            </div>
        </section>
    )
}
