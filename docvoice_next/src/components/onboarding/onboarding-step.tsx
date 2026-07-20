'use client';

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  title: string | React.ReactNode;
  description: string;
  image: string;
  nextHref: string;
  prevHref?: string;
  skipHref?: string;
  badge?: {
    icon: string;
    title: string;
    subtitle: string;
  };
}

export function OnboardingStep({
  step,
  totalSteps,
  title,
  description,
  image,
  nextHref,
  prevHref,
  skipHref = "/master-hub",
  badge
}: OnboardingStepProps) {
  const router = useRouter();

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-primary-foreground">note_stack</span>
          </div>
          <span className="text-2xl font-black italic text-primary">Sootnote</span>
        </div>
        <button
          onClick={() => document.documentElement.classList.toggle('dark')}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-icons block dark:hidden">dark_mode</span>
          <span className="material-icons hidden dark:block text-yellow-400">light_mode</span>
        </button>
      </header>

      <main className="min-h-screen flex items-center justify-center p-4 pt-20">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Illustration Area */}
          <div className="flex justify-center items-center relative order-2 lg:order-1">
            <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 shadow-2xl">
              <Image
                src={image}
                alt="Onboarding Illustration"
                fill
                className="object-cover opacity-95 group-hover:scale-105 transition-transform duration-700"
              />
              {badge && (
                <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-200 dark:border-slate-700 animate-bounce">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="material-icons text-green-600 dark:text-green-400">{badge.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{badge.title}</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{badge.subtitle}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] -z-10 opacity-30"></div>
          </div>

          {/* Content Area */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 order-1 lg:order-2">
            <div className="space-y-4 max-w-md">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-primary leading-tight">
                {title}
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {description}
              </p>
            </div>

            {/* Pagination Dots */}
            <div className="flex gap-2 items-center">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i + 1 === step ? "w-8 bg-primary" : "w-2 bg-slate-300 dark:bg-slate-700"
                  )}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <Link
                href={nextHref}
                className="bg-primary hover:bg-red-700 text-white py-4 px-8 rounded-full font-bold text-lg shadow-lg shadow-red-500/30 text-center active:scale-95 transition-all"
              >
                {step === totalSteps ? "Get Started" : "Next"}
              </Link>
              {prevHref ? (
                <Link href={prevHref} className="text-slate-500 dark:text-slate-400 font-semibold py-2 text-center hover:text-primary transition-colors">
                  Back
                </Link>
              ) : (
                <Link href={skipHref} className="text-primary dark:text-red-400 font-semibold hover:underline decoration-2 underline-offset-4 py-2 text-center">
                  Skip
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 hidden lg:block">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-slate-400 text-sm">
          <div className="flex gap-8">
            <span className="flex items-center gap-1"><span className="material-icons text-xs">verified</span> Secure Payments</span>
            <span className="flex items-center gap-1"><span className="material-icons text-xs">support_agent</span> 24/7 Support</span>
          </div>
          <p>© 2024 Aramex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
