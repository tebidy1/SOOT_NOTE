'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Mic,
  PlayCircle,
  Menu,
  X,
  Check,
  Copy,
  StopCircle,
  Smartphone,
  Monitor,
  Globe,
  Lock,
  Headphones,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

const highlightWords = ['مكتبة', 'منسّقة', 'جاهزة للصق'];

const heroStories = [
  { title: 'تواصل مع مريضك براحة...', subtitle: 'وخذ ملاحظاتك بالقلم كما تحب.' },
  { title: 'دوّنت القياسات بسرعة...', subtitle: 'سجّل الملاحظة بعد الزيارة.' },
  { title: 'ملاحظتك جاهزة ومنسّقة...', subtitle: 'انسخ والصق في نظام المستشفى.' },
];

const howItWorksSteps = [
  { title: 'استرح من الكتابة', desc: 'تواصلك مع مريضك هو القيمة الأهم.' },
  { title: 'مرونة الإدخال', desc: 'ملاحظاتك محفوظة الصقها في النظام براحتك.' },
  { title: 'مرونة الحركة', desc: 'سواء كنت في الراوند او في المكتب سجل ملاحظاتك براحتك.' },
];

const mobileSteps = [
  { title: 'سجّل في أي وقت', desc: 'افتح التطبيق واضغط زر التسجيل. لا داعي للقلق حول الضوضاء أو اللهجة.', icon: Mic },
  { title: 'دقّق النص طبياً', desc: 'شاهد النص يتحول فوراً بذكاء يتعرف على الأدوية والمصطلحات المعقدة.', icon: Headphones },
  { title: 'اختر القالب', desc: 'SOAP، تحويل، أو تقرير خروج. بلمسة واحدة.', icon: Copy },
  { title: 'نسخ للنظام', desc: 'الملاحظة النهائية منسّقة وجاهزة. انسخها والصقها في نظام المستشفى.', icon: Copy },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [mobileStep, setMobileStep] = useState(0);
  const [demoState, setDemoState] = useState<'idle' | 'recording' | 'done'>('idle');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [showInstallMenu, setShowInstallMenu] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setPwaInstalled(true);
      return;
    }

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setPwaInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      if (outcome === 'accepted' || outcome === 'dismissed') {
        setInstallPromptEvent(null);
      }
      return;
    }
    setShowInstallMenu(v => !v);
  }, [installPromptEvent]);

  useEffect(() => {
    const storyTimer = setInterval(() => {
      setStoryIndex(i => (i + 1) % heroStories.length);
    }, 5000);
    return () => clearInterval(storyTimer);
  }, []);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setMobileStep(s => (s + 1) % mobileSteps.length);
    }, 5000);
    return () => clearInterval(stepTimer);
  }, []);

  const handleMicClick = useCallback(() => {
    if (demoState === 'idle') {
      setDemoState('recording');
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds(s => {
          if (s >= 8) {
            clearInterval(timerRef.current);
            setDemoState('done');
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setDemoState('idle');
    }
  }, [demoState]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const navLinks = [
    { name: 'كيف تعمل؟', href: '#how-it-works' },
    { name: 'القوالب', href: '#mobile-showcase' },
    { name: 'المنصات', href: '#platforms' },
    { name: 'الأمان', href: '#security' },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#00A6FB]/30 selection:text-white" dir="rtl">
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full">
        <motion.div
          initial={false}
          className="h-20 border-b border-transparent backdrop-blur-xl transition-all duration-200"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.98)' }}
        >
          <div className="mx-auto flex h-full items-center justify-between px-4 lg:px-8 max-w-7xl">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                <span className="text-2xl font-black tracking-tight text-white">Sout</span>
                <span className="text-2xl font-black tracking-tight text-[#00A6FB]">Note</span>
              </div>
              <div className="hidden sm:block border-r border-white/10 pr-3 mr-3">
                <div className="text-sm font-bold text-white/90 leading-none">صوت</div>
                <div className="text-sm font-bold text-[#00A6FB] leading-none">نوت</div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-[#B9D1E4]">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="px-4 py-2 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {/* pwa install button  */}
              {!pwaInstalled && (
                <div className="relative">
                  <Button
                    onClick={handleInstallClick}
                    className="bg-[#00A6FB] hover:bg-[#0086C8] text-white font-bold rounded-xl shadow-lg shadow-[#00A6FB]/20"
                  >
                    تثبيت التطبيق
                  </Button>
                  {showInstallMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowInstallMenu(false)} />
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-[#0B2C55] border border-[#1E3A5F] rounded-xl shadow-2xl p-4 z-50">
                        {isIOS ? (
                          <>
                            <p className="font-semibold text-sm text-white mb-2">لتثبيت التطبيق على iOS:</p>
                            <ol className="space-y-1.5 text-xs text-[#B9D1E4] list-decimal list-inside">
                              <li>اضغط على زر المشاركة ⬆️</li>
                              <li>اختر "إلى الشاشة الرئيسية"</li>
                              <li>اضغط على "إضافة"</li>
                            </ol>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-sm text-white mb-2">لتثبيت التطبيق:</p>
                            <ol className="space-y-1.5 text-xs text-[#B9D1E4] list-decimal list-inside">
                              <li>افتح قائمة المتصفح ⋮</li>
                              <li>اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"</li>
                            </ol>
                          </>
                        )}
                        <div className="mt-3 flex justify-end border-t border-[#1E3A5F] pt-3">
                          <button
                            onClick={() => setShowInstallMenu(false)}
                            className="text-xs text-[#00A6FB] hover:underline font-medium"
                          >
                            حسناً
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* <Link href="/auth/login">
                <Button variant="outline" className="border-[#1E3A5F] text-[#B9D1E4] hover:text-white hover:border-[#00A6FB] font-bold rounded-xl">
                  تسجيل الدخول
                </Button>
              </Link> */}
              {/* <Link href="/auth/register" className="hidden sm:block">
                <Button className="bg-[#00A6FB] hover:bg-[#0086C8] text-white font-bold rounded-xl shadow-lg shadow-[#00A6FB]/20">
                  جرّب الآن مجانًا
                </Button> 
            </Link> */}
              <Button className="lg:hidden" onClick={() => setMobileMenuOpen(true)} variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[#0F172A] p-8 shadow-2xl border-l border-[#1E3A5F]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-12 flex items-center justify-between">
                <span className="font-black text-xl text-white">القائمة</span>
                <Button onClick={() => setMobileMenuOpen(false)} variant="ghost" size="icon">
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex flex-col gap-6">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xl font-bold text-[#B9D1E4] hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <hr className="border-[#1E3A5F]" />
                <Link href="/auth/login" className="text-lg font-bold text-[#B9D1E4] hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  تسجيل الدخول
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#00A6FB] hover:bg-[#0086C8] text-white font-bold rounded-xl">
                    جرّب الآن مجانًا
                  </Button>
                </Link>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* Text Content - Left side on desktop (RTL: end) */}
            <div className="lg:col-span-6 lg:col-start-7 text-center lg:text-right">
              <FadeIn>
                <h1 className="mb-6 text-4xl font-black leading-[1.2] lg:text-5xl">
                  سجّل ملاحظتك الطبية…<br />
                  وخذها جاهزة للصق خلال ثوانٍ
                </h1>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6 text-xl lg:text-2xl font-bold">
                  {highlightWords.map((word, i) => (
                    <React.Fragment key={word}>
                      {i > 0 && <span className="text-[#00A6FB]/50">•</span>}
                      <span className="text-white relative">
                        {word}
                        <motion.span
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00A6FB]"
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: i * 0.3 }}
                        />
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="mb-10 text-lg text-[#B9D1E4]/80 font-medium">
                  سجّل → اختر قالبًا → انسخ للصق في نظام المستشفى
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="flex flex-col items-center lg:items-start gap-4 sm:flex-row">
                  <Button
                    onClick={() => { const el = document.getElementById('demo-section'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="h-14 rounded-2xl px-8 text-lg font-bold bg-[#00A6FB] hover:bg-[#0086C8] shadow-xl shadow-[#00A6FB]/20"
                  >
                    <Mic className="ml-2 h-5 w-5" />
                    جرّب الآن
                  </Button>
                  <Button variant="ghost" className="h-14 rounded-2xl px-8 text-lg font-bold text-[#B9D1E4] hover:text-white hover:bg-white/5">
                    <PlayCircle className="ml-2 h-5 w-5" />
                    شاهد مثال جاهز
                  </Button>
                </div>
                <p className="mt-3 text-sm text-[#64748B]">
                  بدون بطاقة — جرّب التجربة مباشرة.
                </p>
              </FadeIn>
            </div>

            {/* Cinematic Slider - Right side on desktop (RTL: start) */}
            <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 mt-12 lg:mt-0">
              <FadeIn>
                <div className="relative overflow-hidden rounded-2xl" style={{ height: 360 }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={storyIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={
                          storyIndex === 0 ? '/images/landing/story_01_consult.jpg' :
                            storyIndex === 1 ? '/images/landing/story_02_record.png' :
                              '/images/landing/story_03_ehr.png'
                        }
                        alt={heroStories[storyIndex].title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Text Overlay */}
                  <div className="absolute bottom-6 right-6 left-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={storyIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6 }}
                        className="bg-black/70 backdrop-blur-sm rounded-xl p-5 border border-white/10"
                      >
                        <h3 className="text-lg font-bold text-white">{heroStories[storyIndex].title}</h3>
                        <p className="text-sm text-[#00A6FB] mt-1">{heroStories[storyIndex].subtitle}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Dots */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {heroStories.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setStoryIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === storyIndex ? 'bg-[#00A6FB] w-6' : 'bg-white/30'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Live Demo Section */}
          <div id="demo-section" className="mt-16 lg:mt-24 max-w-2xl mx-auto">
            <FadeIn>
              <div className="relative rounded-2xl border border-[#00A6FB]/20 shadow-2xl shadow-[#00A6FB]/10 overflow-hidden" style={{ paddingBottom: 40 }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00A6FB]/5 to-transparent animate-pulse" />
                <div className="relative p-8 pb-16 text-center">
                  {demoState === 'idle' && (
                    <motion.p
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-lg text-[#B9D1E4]"
                    >
                      جرب الان .. اضغط المايك وسجل ملاحظتك الطبية
                    </motion.p>
                  )}
                  {demoState === 'recording' && (
                    <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-[#EF4444] font-bold text-lg mb-4">جاري الاستماع...</p>
                      <p className="text-4xl font-mono font-light text-white">
                        00:{recordSeconds.toString().padStart(2, '0')}
                      </p>
                    </motion.div>
                  )}
                  {demoState === 'done' && (
                    <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-white text-lg mb-4">
                        مريض يبلغ من العمر 21 عامًا يعاني من صداع نصفي حاد منذ 3 أيام.
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/20">
                        <Check className="w-4 h-4 text-[#2ECC71]" />
                        <span className="text-sm text-[#2ECC71]/90">تم إنشاء الملاحظة بنجاح</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Mic Button */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                  <motion.button
                    onClick={handleMicClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${demoState === 'recording'
                      ? 'bg-[#EF4444] shadow-[#EF4444]/50'
                      : 'bg-[#00A6FB] shadow-[#00A6FB]/50'
                      }`}
                  >
                    {demoState === 'recording' ? (
                      <StopCircle className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </motion.button>
                  {demoState === 'recording' && (
                    <>
                      <motion.span
                        className="absolute inset-0 rounded-full bg-[#EF4444]/30"
                        animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.span
                        className="absolute inset-0 rounded-full bg-[#EF4444]/20"
                        animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                      />
                    </>
                  )}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 px-4 bg-[#0F172A]">
        <div className="mx-auto max-w-6xl">
          {/* QR Experience */}
          <FadeIn>
            <div className="mb-24 p-8 rounded-2xl bg-[#0B2C55]/50 border border-[#00A6FB]/20 shadow-lg shadow-[#00A6FB]/5">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                <div className="text-center lg:text-right">
                  <h3 className="text-2xl font-bold text-[#00A6FB] mb-3">عش التجربة الاحترافية</h3>
                  <p className="text-xl text-white font-medium">امسح الكود الآن .. وجرب التطبيق</p>
                  <p className="text-base text-[#B9D1E4] mt-2">وتحكم في النظام بالكامل من هاتفك</p>
                </div>
                <div className="hidden lg:block w-px h-24 bg-white/10" />
                <div className="bg-white p-4 rounded-2xl shadow-xl shadow-[#00A6FB]/20">
                  <div className="w-40 h-40 bg-white flex items-center justify-center">
                    <div className="w-32 h-32 border-2 border-black/10 rounded-lg flex items-center justify-center">
                      <div className="grid grid-cols-5 gap-0.5">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} className={`w-2 h-2 ${(i * 7 + 3) % 17 > 8 ? 'bg-black' : 'bg-white'} ${i === 12 ? 'bg-[#00A6FB]' : ''}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* 3 Steps with Timeline */}
          <div className="relative">
            {/* Vertical line desktop */}
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-transparent via-[#00A6FB]/40 to-transparent" />

            {howItWorksSteps.map((step, i) => {
              const isRight = i % 2 === 0;
              return (
                <FadeIn key={i} delay={i * 0.2}>
                  <div className="relative flex flex-col lg:flex-row items-center gap-8 mb-24 last:mb-0">
                    {/* Center Node */}
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-[#0F172A] border-[3px] items-center justify-center"
                      style={{
                        borderColor: i === 0 ? '#00A6FB' : i === 1 ? '#0086C8' : '#2ECC71'
                      }}
                    >
                      <div className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: i === 0 ? '#00A6FB' : i === 1 ? '#0086C8' : '#2ECC71' }}
                      />
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${isRight ? 'lg:order-1 lg:pl-16' : 'lg:order-3 lg:pr-16'}`}>
                      <div className={`${isRight ? 'lg:text-left' : 'lg:text-right'} text-center`}>
                        <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                        <p className="text-lg text-[#B9D1E4] leading-relaxed">{step.desc}</p>
                      </div>
                    </div>

                    {/* Card */}
                    <div className={`flex-1 ${isRight ? 'lg:order-3' : 'lg:order-1'} w-full lg:w-auto`}>
                      <div className="h-64 rounded-2xl overflow-hidden border border-white/10 shadow-xl relative bg-[#0B2C55]">
                        <Image
                          src={
                            i === 0 ? '/images/landing/step_01_record_v3.png' :
                              i === 1 ? '/images/landing/step_02_process.png' :
                                '/images/landing/step_03_result.jpg'
                          }
                          alt={step.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute bottom-4 right-4">
                          <div className="px-4 py-2 rounded-full text-white font-bold text-lg"
                            style={{
                              backgroundColor: i === 0 ? '#00A6FB' : i === 1 ? '#0086C8' : '#2ECC71'
                            }}
                          >
                            {i + 1}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-24 px-4" style={{ backgroundColor: '#041B30' }}>
        <div className="mx-auto max-w-6xl text-center">
          <FadeIn>
            <h2 className="text-3xl lg:text-4xl font-bold mb-12">منظومة متكاملة لعيادتك</h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'إضافة المتصفح', desc: 'بجانب نظامك اليومي', btn: 'تحميل الإضافة (ZIP)', color: '#06B6D4' },
              { icon: Monitor, title: 'Windows Desktop', desc: 'الأسرع للعيادة والمكتب', btn: 'نسخة Windows', color: '#00A6FB', primary: true },
              { icon: Smartphone, title: 'تطبيق الأندرويد', desc: 'سجّل أثناء الحركة', btn: 'تحميل تطبيق APK', color: '#2ECC71' },
            ].map((platform, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className={`p-8 rounded-2xl bg-[#0B2C55] border text-center ${platform.primary
                  ? 'border-[#00A6FB]/50 shadow-xl shadow-[#00A6FB]/20'
                  : 'border-[#1E3A5F]'
                  }`}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <platform.icon className="w-8 h-8" style={{ color: platform.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{platform.title}</h3>
                  <p className="text-sm text-[#B9D1E4] mb-8">{platform.desc}</p>
                  <Button
                    className="w-full font-bold rounded-xl py-6"
                    style={{ backgroundColor: platform.primary ? '#00A6FB' : '#1E293B', color: 'white' }}
                  >
                    {platform.btn}
                  </Button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Showcase Section */}
      <section id="mobile-showcase" className="py-24 px-4 bg-[#0F172A]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Phone Frame */}
            <FadeIn>
              <div className="relative w-72 h-[580px] shrink-0">
                <div className="absolute inset-0 bg-black rounded-[3.5rem] border-[6px] border-[#2A2A2A] shadow-2xl shadow-[#00A6FB]/20">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-10" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full z-10" />
                  <div className="h-full w-full rounded-[2.8rem] overflow-hidden bg-[#111111] pt-10 pb-6">
                    {/* Phone Screen Content */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={mobileStep}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4 }}
                        className="h-full flex flex-col px-5"
                      >
                        {mobileStep === 0 && (
                          <>
                            <div className="flex items-center justify-between mb-6">
                              <span className="text-2xl font-bold text-white">Inbox</span>
                              <div className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-gray-500" />
                              </div>
                            </div>
                            <div className="space-y-3 flex-1">
                              {[
                                { title: 'Draft Note', preview: '21-year old male, high fever...', time: '10:03', color: '#FFC107' },
                                { title: 'Sick Leave', preview: 'Recommendation for 3 days...', time: '09:58', color: '#EF4444' },
                                { title: 'Draft Note', preview: 'Follow up visit, diabetes...', time: 'Yesterday', color: '#00A6FB' },
                              ].map((item, j) => (
                                <div key={j} className="bg-[#1E1E1E] rounded-2xl p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${item.color}30` }}>
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    </div>
                                    <span className="text-white font-bold text-sm">{item.title}</span>
                                    <div className="mr-auto">
                                      <Copy className="w-4 h-4 text-gray-500" />
                                    </div>
                                  </div>
                                  <p className="text-gray-400 text-xs mb-2">{item.preview}</p>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-500 text-xs">{item.time}</span>
                                    <span className="mr-auto text-[#FFC107] text-xs font-bold">Draft</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="h-16 flex items-center justify-around bg-[#1A1A1A] rounded-t-2xl -mx-5 px-5">
                              <div className="w-6 h-6 rounded-full bg-[#00A6FB]" />
                              <div className="w-6 h-6 rounded-full bg-gray-600" />
                            </div>
                          </>
                        )}

                        {mobileStep === 1 && (
                          <div className="pt-4">
                            <div className="flex items-center justify-between mb-6">
                              <div className="w-6 h-6" />
                              <span className="text-white font-bold">Review</span>
                              <Check className="w-6 h-6 text-[#00A6FB]" />
                            </div>
                            <p className="text-white text-sm leading-relaxed">
                              Pt presents with <span className="bg-[#263238] font-bold">severe migraine</span> started 3 days ago. Associated with <span className="bg-[#263238]">photophobia</span>. Vitals are stable.
                            </p>
                            <div className="mt-auto pt-8 flex flex-wrap gap-2">
                              {['Migraine', 'Neurology', 'SOAP Note'].map((chip, j) => (
                                <span key={j} className={`px-3 py-1.5 rounded-full text-xs border ${j === 2 ? 'bg-[#00A6FB] border-[#00A6FB] text-white' : 'bg-white/10 border-white/20 text-white'
                                  }`}>
                                  {chip}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {mobileStep === 2 && (
                          <div className="pt-4">
                            <div className="flex items-center justify-between mb-6">
                              <div className="w-6 h-6" />
                              <span className="text-white font-bold">Templates</span>
                              <div className="w-6 h-6" />
                            </div>
                            <div className="space-y-3">
                              {[
                                { name: 'SOAP Note', desc: 'Subj, Obj, Assessment, Plan' },
                                { name: 'Discharge Summary', desc: 'Hospital course & follow-up' },
                                { name: 'Consultation Note', desc: 'Referral & recommendations' },
                              ].map((t, j) => (
                                <div key={j} className={`p-4 rounded-2xl border ${j === 0 ? 'border-[#00A6FB]/50 bg-[#00A6FB]/10' : 'border-white/10 bg-[#1E1E1E]'
                                  }`}>
                                  <p className="text-white font-bold text-sm">{t.name}</p>
                                  <p className="text-gray-400 text-xs mt-1">{t.desc}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {mobileStep === 3 && (
                          <div className="pt-4 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-6 h-6" />
                              <span className="text-white font-bold text-sm">Final Note</span>
                              <div className="w-6 h-6" />
                            </div>
                            <div className="flex-1 bg-white rounded-2xl p-4 overflow-hidden">
                              <p className="text-black font-bold text-xs mb-2">SOAP NOTE</p>
                              <hr className="mb-2 border-black/10" />
                              <p className="text-black/70 text-[10px] font-bold">SUBJECTIVE:</p>
                              <p className="text-black/60 text-[10px] mb-2">Patient is a 21yo male presenting with severe migraine...</p>
                              <p className="text-black/70 text-[10px] font-bold">OBJECTIVE:</p>
                              <p className="text-black/60 text-[10px] mb-2">Vitals stable. BP 120/80. No focal deficit.</p>
                              <p className="text-black/70 text-[10px] font-bold">ASSESSMENT:</p>
                              <p className="text-black/60 text-[10px] mb-2">Acute Migraine without Aura.</p>
                              <p className="text-black/70 text-[10px] font-bold">PLAN:</p>
                              <p className="text-black/60 text-[10px]">1. Ibuprofen 400mg. 2. Rest. 3. Follow up.</p>
                            </div>
                            <div className="mt-4 bg-[#2ECC71] rounded-full py-3 flex items-center justify-center gap-2">
                              <Copy className="w-4 h-4 text-white" />
                              <span className="text-white font-bold text-sm">Copy to System</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Steps List */}
            <div className="flex-1">
              <FadeIn>
                <div className="inline-flex px-4 py-1.5 rounded-full bg-[#00A6FB]/10 border border-[#00A6FB]/20 mb-6">
                  <span className="text-[#00A6FB] text-xs font-bold">تطبيق الجوال</span>
                </div>
                <h2 className="text-4xl font-bold mb-4 leading-tight">
                  عيادتك في جيبك...<br />
                  في كل وقت.
                </h2>
                <p className="text-lg text-[#B9D1E4] leading-relaxed mb-10">
                  سواء كنت في جولة في المستشفى أو في العيادة، DocVoice معك لتدوين الملاحظات لحظة بلحظة.
                </p>
              </FadeIn>

              <div className="space-y-3">
                {mobileSteps.map((step, i) => {
                  const isActive = mobileStep === i;
                  return (
                    <motion.button
                      key={i}
                      onClick={() => setMobileStep(i)}
                      className={`w-full text-right p-4 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#0B2C55] border border-[#00A6FB]/50' : 'hover:bg-white/5'
                        }`}
                      whileHover={{ x: -4 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full transition-all ${isActive ? 'bg-[#00A6FB]' : 'bg-[#0B2C55]'
                          }`}>
                          <step.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${isActive ? 'text-white' : 'text-[#B9D1E4]'}`}>
                            {step.title}
                          </p>
                          {isActive && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-[#B9D1E4]/60 mt-1"
                            >
                              {step.desc}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 px-4 bg-[#0F172A]">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <Lock className="w-16 h-16 text-white/60 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-8">خصوصيتك أولًا</h2>
            <div className="space-y-4">
              {[
                'لا نضيف تعقيدًا على سير العمل',
                'تحكم واضح في ما تُسجّله وما تُخرجه',
                'مصمم لتقليل إدخال البيانات يدويًا',
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-lg text-[#B9D1E4]">{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative h-[500px] lg:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3B] via-[#082E5A] to-[#06B6D4]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/60 to-transparent" />
        <div className="relative h-full flex items-end pb-24 justify-center px-4">
          <div className="text-center max-w-2xl">
            <FadeIn>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-white drop-shadow-lg">
                استعد وقتك المفقود مع العائلة.
              </h2>
              <p className="text-lg text-[#B9D1E4] mb-10">
                أنهِ عيادتك في وقتها تماماً. جرب SoutNote الآن.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register">
                  <Button className="h-14 rounded-2xl px-10 text-lg font-bold bg-[#00A6FB] hover:bg-[#0086C8] shadow-xl shadow-[#00A6FB]/30">
                    ابدأ الآن مجانًا
                  </Button>
                </Link>
                <Button variant="ghost" className="h-14 rounded-2xl px-10 text-lg font-bold text-white/70 hover:text-white">
                  شاهد الفيديو التعريفي
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Cinematic Slider Section (Full) */}
      <section className="py-24 px-4 bg-[#0F172A]">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl font-bold text-center mb-16">قصة النجاح</h2>
          </FadeIn>

          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ aspectRatio: '16/9' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={storyIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={
                      storyIndex === 0 ? '/images/landing/story_01_consult.jpg' :
                        storyIndex === 1 ? '/images/landing/story_02_record.png' :
                          '/images/landing/story_03_ehr.png'
                    }
                    alt={heroStories[storyIndex].title}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute bottom-8 right-8 left-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={storyIndex}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.6 }}
                    className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                  >
                    <h3 className="text-2xl font-bold text-white">{heroStories[storyIndex].title}</h3>
                    <p className="text-lg text-[#00A6FB] mt-2">{heroStories[storyIndex].subtitle}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="absolute top-6 left-6 flex gap-2">
                {heroStories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStoryIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === storyIndex ? 'bg-[#00A6FB] w-8' : 'bg-white/30 w-2'
                      }`}
                  />
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-[#0B2C55] border-t border-[#1E3A5F]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[#B9D1E4] text-sm">© SoutNote — 2026</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-[#B9D1E4] text-sm hover:text-white transition-colors">الخصوصية</Link>
              <Link href="#" className="text-[#B9D1E4] text-sm hover:text-white transition-colors">الشروط</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Quick Access Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/95 to-transparent md:hidden z-40">
        <Link href="/auth/register">
          <Button className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-l from-[#00A6FB] to-[#00D1FF] shadow-xl shadow-[#00A6FB]/30 text-white">
            <ArrowLeft className="ml-2 h-5 w-5" />
            ابدأ الآن — مجاناً
          </Button>
        </Link>
      </div>
      <div className="h-20 md:hidden" />
    </div >
  );
}
