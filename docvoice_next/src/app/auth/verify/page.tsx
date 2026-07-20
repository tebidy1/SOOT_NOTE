'use client';

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Image from "next/image";

export default function VerificationPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = () => {
    // Mock verification
    router.push('/dashboard');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 font-body">Welcome To</h2>
          <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-primary-foreground">note_stack</span>
                </div>
                <span className="text-4xl font-black italic text-primary">Sootnote</span>
            </div>
        </div>

        <div className="space-y-1">
          <p className="text-gray-600 dark:text-gray-400 font-medium">We sent the verification code to</p>
          <p className="text-gray-900 dark:text-white font-bold text-lg tracking-wide">966573838872</p>
        </div>

        <div className="flex justify-between gap-3 px-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              className="w-16 h-20 text-center text-3xl font-black border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:ring-primary focus:border-primary outline-none dark:text-white"
              maxLength={1}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
            />
          ))}
        </div>

        <div className="px-4">
          <button
            onClick={handleVerify}
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl shadow-lg shadow-red-500/10 hover:bg-[#c12421] transition-all"
          >
            Verify & Proceed
          </button>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            We&apos;ll send you an SMS verification code
          </p>
        </div>

        <div className="mx-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl space-y-4">
          <p className="text-gray-700 dark:text-gray-300 font-semibold">
            Didn&apos;t receive the verification code?
          </p>
          <div className="flex justify-around items-center">
            <button className="text-primary hover:underline font-semibold text-sm flex flex-col items-center">
              Resend SMS
              <span className="text-xs text-gray-400 font-normal">(0:54)</span>
            </button>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
            <button className="text-primary hover:underline font-semibold text-sm flex flex-col items-center">
              Resend Email
              <span className="text-xs text-gray-400 font-normal">(0:54)</span>
            </button>
          </div>
        </div>

        <div className="pt-8">
          <button
            className="text-gray-400 dark:text-gray-600 hover:text-primary dark:hover:text-primary transition-colors"
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
