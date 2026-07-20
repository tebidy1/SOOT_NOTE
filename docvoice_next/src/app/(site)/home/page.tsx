'use client';

import { Footer } from "@/components/layouts/footer";
import { Header } from "@/components/layouts/header";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-blue-50/50 to-white text-foreground min-h-screen transition-colors duration-300">
      <Header />

      <header className="gradient-primary pt-12 pb-24 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-primary-foreground text-3xl font-bold mb-8">Track your shipment</h1>
          <div className="relative max-w-2xl mx-auto">
            <Input
              className="h-16 ps-6 pe-16 text-lg rounded-2xl shadow-2xl"
              placeholder="My tracking number"
              type="text"
            />
            <Link href="/admin/shipments/9876543210" className="absolute end-3 top-2.5 bg-primary p-3 rounded-xl text-primary-foreground hover:bg-primary/90 transition inline-flex items-center justify-center">
              <span className="material-icons-outlined text-2xl">search</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Gradient Greeting */}
            <div className="rounded-3xl p-8 flex items-center justify-between shadow-xl relative overflow-hidden group bg-gradient-to-r from-green-500 to-teal-500">
              <div className="relative z-10 text-white">
                <h2 className="text-3xl font-bold">Good Morning,</h2>
                <p className="text-white/80 mt-2 text-lg">Check your shipment updates below.</p>
              </div>
              <div className="relative z-10">
                <span className="material-icons-outlined text-8xl text-white opacity-90 drop-shadow-lg">wb_sunny</span>
              </div>
              <div className="absolute -end-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition"></div>
            </div>

            {/* Shipment Entry */}
            <Link href="/admin/shipments/9876543210" className="bg-card rounded-3xl p-8 shadow-sm flex items-center justify-between border border-border hover:shadow-md transition cursor-pointer">
              <div className="flex items-center space-x-6">
                <div className="bg-primary/10 p-4 rounded-2xl relative w-16 h-16">
                  <Image
                    alt="Shipment package illustration"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA72LX4e30Kx9tXFwg2JvJMtuQ7Nxs4ouKLFEKdHUEGp398DatLBgROYE6WecKKRMuO8cy6eB1tSSlt6aQfYWdytD-SD2fsBaO4_XLVuVw2DtRL0l_Kwh0LrJAzmvV5I9HT443PB5DRESH8nDxk35sFNJ8DPGosp7tgTAw0ua9hc27YwOU1ip1TjH5_xQLBmZDamwVr2K1vXVlNgeEWA5GIgwpHABlHzu1mBAXgGbL4ABcWZ1qWaXW9Z_m1mPdfDMZe1bmq3b9vhC0"
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">My shipment(s)</h3>
                  <p className="text-muted-foreground font-body">View current status and delivery schedule</p>
                </div>
              </div>
              <div className="bg-muted p-3 rounded-full text-primary">
                <span className="material-icons-outlined text-3xl rtl:rotate-180">chevron_right</span>
              </div>
            </Link>

            {/* Security Banner */}
            <div className="rounded-3xl overflow-hidden shadow-2xl relative min-h-[400px] flex flex-col md:flex-row items-center p-8 md:p-12 bg-gradient-to-br from-primary via-secondary to-primary/80">
              <div className="flex-1 space-y-6 z-10 text-primary-foreground">
                <h2 className="text-5xl font-black italic tracking-tighter">STAY SHARP.</h2>
                <p className="text-2xl leading-snug">
                  If it's not from our app or verified account, it's not us.
                </p>
                <p className="text-primary-foreground/90 text-4xl font-bold">
                  Don't click, <br />
                  don't pay, <br />
                  don't share.
                </p>
                <div className="flex gap-3 mt-4">
                  <span className="w-3 h-3 rounded-full bg-primary-foreground"></span>
                  <span className="w-3 h-3 rounded-full bg-primary-foreground/30"></span>
                </div>
              </div>
              <div className="flex-1 relative mt-8 md:mt-0">
                <div className="relative mx-auto w-64 h-auto transform rotate-6 hover:rotate-0 transition duration-500">
                  <div className="bg-foreground/80 rounded-[2.5rem] border-8 border-foreground p-4 shadow-2xl">
                    <div className="bg-black h-96 rounded-[1.5rem] overflow-hidden flex flex-col items-center justify-center text-center p-4">
                      <span className="material-symbols-outlined text-destructive text-6xl mb-4">cancel</span>
                      <p className="text-primary-foreground text-[10px] uppercase tracking-widest mb-2">Security Warning</p>
                      <div className="w-full bg-foreground/50 h-2 rounded-full mb-2"></div>
                      <div className="w-4/5 bg-foreground/50 h-2 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -end-4 bg-primary-foreground rounded-full p-2 shadow-lg">
                    <span className="material-symbols-outlined text-destructive font-bold">close</span>
                  </div>
                  <div className="absolute -bottom-4 -start-4 bg-primary-foreground rounded-full p-3 shadow-lg">
                    <span className="material-symbols-outlined text-primary text-3xl">phishing</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-10 start-1/4 w-12 h-12 bg-destructive rotate-12"></div>
                <div className="absolute bottom-20 start-10 w-24 h-24 bg-destructive -rotate-12"></div>
                <div className="absolute top-1/2 end-1/4 w-8 h-8 bg-secondary rotate-45"></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
              <h3 className="text-xl font-bold mb-6 text-foreground">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/admin/shipments/pickup" className="flex flex-col items-center justify-center p-4 bg-muted rounded-2xl hover:bg-primary hover:text-primary-foreground transition group">
                  <span className="material-symbols-outlined text-3xl mb-2 text-primary group-hover:text-primary-foreground">local_shipping</span>
                  <span className="text-sm font-medium">New Shipment</span>
                </Link>
                <button className="flex flex-col items-center justify-center p-4 bg-muted rounded-2xl hover:bg-primary hover:text-primary-foreground transition group cursor-pointer">
                  <span className="material-symbols-outlined text-3xl mb-2 text-primary group-hover:text-primary-foreground">payments</span>
                  <span className="text-sm font-medium">Pay Fees</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-muted rounded-2xl hover:bg-primary hover:text-primary-foreground transition group cursor-pointer">
                  <span className="material-symbols-outlined text-3xl mb-2 text-primary group-hover:text-primary-foreground">schedule</span>
                  <span className="text-sm font-medium">Schedule</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-muted rounded-2xl hover:bg-primary hover:text-primary-foreground transition group cursor-pointer">
                  <span className="material-symbols-outlined text-3xl mb-2 text-primary group-hover:text-primary-foreground">help_outline</span>
                  <span className="text-sm font-medium">Support</span>
                </button>
              </div>
            </div>

            {/* Express Delivery Card */}
            <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border">
              <div className="relative w-full h-48">
                <Image
                  alt="Aramex courier delivering package"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVeUM4I-6cFgq1P69JhC1DC8n7L4_EKXEojRBEvKRpHQRXOSfhJbn02YmNTQWoUlFPeqy393lsC255LYIPnpIp_gR8Lyx77m2NJ7Rn6XQ0ffV0E3x71THqqqAkUgZr6NIGmPpCVw4JnT9mvMkHHzjkug4gu4MiV4TcB3rFp7ltfPik0JnljQUokBFuWYUZ5UEWY-DinyT2o9Rkh_fdbXjUtmeCLwp_Tgy5nBED42i2f1Za7unZtigVxzmun83AQpJw0J_mRf_RQuE"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-foreground">Express Delivery</h4>
                <p className="text-muted-foreground mt-2 font-body text-sm">
                  Get your items delivered faster with our premium express service. Nationwide coverage and real-time tracking.
                </p>
                <button className="mt-4 text-primary font-bold inline-flex items-center hover:underline">
                  Learn More <span className="material-icons-outlined text-sm ms-1 text-primary rtl:rotate-180">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
