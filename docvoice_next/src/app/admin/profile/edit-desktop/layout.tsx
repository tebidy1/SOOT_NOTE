import { AramexHeader } from '@/components/aramex-header';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            <AramexHeader />
            <main className="container mx-auto px-4 lg:px-8 py-10">
                <div className="flex flex-col lg:flex-row gap-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
