'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  // Determine if we're on login or register page
  const isLoginPage = pathname === '/auth/login';
  const isRegisterPage = pathname === '/auth/register';
  
  // Hydration protection for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);
  
  // Go back to homepage
  const goBack = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex flex-col">
      {/* Top navigation */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <button
            onClick={goBack}
            className="flex items-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-medium">Back to Home</span>
          </button>
          
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-all duration-300"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="md:grid md:grid-cols-5">
              {/* Left side - Decorative panel */}
              <div className="hidden md:block md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-700 dark:to-indigo-900 p-12 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-white blur-2xl transform translate-x-1/2 translate-y-1/2"></div>
                </div>
                
                <div className="relative h-full flex flex-col justify-between z-10">
                  {/* Logo */}
                  <div className="flex items-center space-x-2">
                    <div className="relative overflow-hidden rounded-full w-10 h-10 flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-sm">
                      <span className="font-bold text-white text-lg">R</span>
                    </div>
                    <span className="text-xl font-bold text-white">
                      Rising BSM
                    </span>
                  </div>
                  
                  {/* Message */}
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-6">
                      {isLoginPage ? 'Welcome back!' : 'Join our community'}
                    </h2>
                    <p className="text-indigo-100 mb-8 leading-relaxed">
                      {isLoginPage
                        ? 'Access your dashboard to manage customers, appointments, and requests with our powerful platform.'
                        : 'Create an account to get started with Rising BSM\'s open-source business management platform.'}
                    </p>
                    <div className="flex">
                      <span className="inline-flex h-1 w-10 rounded bg-indigo-400"></span>
                    </div>
                  </div>
                  
                  {/* Features list */}
                  <div>
                    <h3 className="text-indigo-100 font-medium mb-4">
                      {isLoginPage ? 'Account benefits' : 'What you\'ll get'}
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start text-indigo-100">
                        <svg className="h-5 w-5 text-indigo-300 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Customer relationship management</span>
                      </li>
                      <li className="flex items-start text-indigo-100">
                        <svg className="h-5 w-5 text-indigo-300 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Smart appointment scheduling</span>
                      </li>
                      <li className="flex items-start text-indigo-100">
                        <svg className="h-5 w-5 text-indigo-300 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Real-time analytics dashboard</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Right side - Form content */}
              <div className="p-8 md:p-12 md:col-span-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, x: isLoginPage ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isLoginPage ? 30 : -30 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
