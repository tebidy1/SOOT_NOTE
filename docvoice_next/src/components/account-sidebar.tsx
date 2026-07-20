import { cn } from '@/lib/utils';
import { Heart, MapPin, Shield, Trash2, User } from 'lucide-react';
import Link from 'next/link';

interface SidebarItem {
    name: string;
    icon: any;
    href: string;
    active?: boolean;
}

const sidebarItems: SidebarItem[] = [
    { name: 'My Profile', icon: User, href: '/profile/edit-desktop', active: true },
    { name: 'Address Book', icon: MapPin, href: '#' },
    { name: 'My Preferences', icon: Heart, href: '#' },
    { name: 'Security Settings', icon: Shield, href: '#' },
    { name: 'Delete Account', icon: Trash2, href: '#' },
];

export function AccountSidebar() {
    return (
        <aside className="w-full lg:w-64 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900 px-2 mb-4">My Account</h2>
                <nav className="space-y-1">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-lg transition-colors",
                                item.active
                                    ? "bg-accent text-accent-foreground"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", item.active ? "text-primary" : "text-gray-400")} />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Quick Support</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                    Need help with your account? <Link href="#" className="underline font-semibold">Visit Support Center</Link>
                </p>
            </div>
        </aside>
    );
}
