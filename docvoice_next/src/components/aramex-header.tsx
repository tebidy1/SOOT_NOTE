import Link from 'next/link';
import { Search, Bell, User, MapPin, Package, Settings, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AramexHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
                {/* Left: Logo */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-3xl font-black italic tracking-tighter text-[#D32F2F]">Sootnote</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-6 lg:flex">
                        {['Track', 'Ship', 'Manage', 'Solutions', 'Support'].map((item) => (
                            <Link
                                key={item}
                                href="#"
                                className="text-sm font-semibold text-gray-700 hover:text-[#D32F2F] transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-2 lg:flex">
                        <Button variant="ghost" size="icon" className="text-gray-600">
                            <Search className="h-5 w-5" />
                        </Button>
                        <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>
                        <button className="text-sm font-bold text-gray-700 hover:text-[#D32F2F]">
                            AE / EN
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="relative text-gray-600">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-[#D32F2F]"></span>
                        </Button>

                        <button className="flex items-center gap-2 rounded-full border border-gray-200 p-1 pr-3 hover:bg-gray-50 transition-colors">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="text-xs font-semibold text-gray-900 leading-none">Aramex User</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
