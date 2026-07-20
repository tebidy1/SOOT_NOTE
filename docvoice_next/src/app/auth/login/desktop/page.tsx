import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';

export default function DesktopLoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 py-12">
            <div className="mb-10 flex flex-col items-center">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-primary-foreground">note_stack</span>
                    </div>
                    <span className="text-4xl font-black italic text-primary">Sootnote</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">Delivery Unlimited</p>
            </div>

            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
                <div className="p-6 sm:p-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">Welcome Back</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-10 font-medium">Please enter your details to sign in.</p>

                    <form className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-bold text-gray-700 dark:text-gray-300">Mobile Number</Label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="w-full sm:w-24 h-14 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-base font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <span className="ms-2 text-lg">🇯🇴</span>
                                    <span>+962</span>
                                </div>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="7 9XXX XXXX"
                                    className="flex-1 h-14 border-gray-200 dark:border-gray-600 focus:border-primary focus:ring-primary/10 rounded-2xl text-lg font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-bold text-gray-700 dark:text-gray-300">Password</Label>
                                <Link href="#" className="text-sm font-bold text-primary hover:underline">Forgot password?</Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="h-14 border-gray-200 dark:border-gray-600 focus:border-primary focus:ring-primary/10 rounded-2xl text-lg font-medium"
                            />
                        </div>

                        <Button className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg rounded-2xl shadow-lg transition-all active:scale-95 mt-4">
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Don't have an account? <Link href="#" className="text-primary font-bold hover:underline">Create one</Link>
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-wrap justify-center gap-6 border-t border-gray-100 dark:border-gray-700">
                    {['Google', 'Facebook', 'Apple'].map((provider) => (
                        <button key={provider} className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {provider}
                        </button>
                    ))}
                </div>
            </div>

            <footer className="mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {['Privacy Policy', 'Terms of Use', 'Help Center'].map((item) => (
                    <Link key={item} href="#" className="text-xs font-semibold text-gray-400 hover:text-gray-600">
                        {item}
                    </Link>
                ))}
            </footer>
        </div>
    );
}
