'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Moon, Sun, LayoutDashboard } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Header component for RISING BS e.U.
 * Professional service company header with orange/blue branding
 */
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();

  // Active link checker (optional depth checking)
  const isActive = useCallback((path: string, exact = false) => {
    if (exact) return pathname === path;
    return pathname?.startsWith(path);
  }, [pathname]);

  // Scroll handler for transparent header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll(); // Initial check
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hydration protection for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Close menu and scroll to a section
  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // Account for header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || pathname !== '/' 
          ? 'bg-white/95 dark:bg-slate-900/95 shadow-md backdrop-blur-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="relative">
              <div className="relative overflow-hidden rounded-lg w-10 h-10 flex items-center justify-center bg-gradient-to-br from-orange-500 to-blue-500 shadow-lg shadow-orange-500/20">
                <span className="font-bold text-white text-lg">R</span>
              </div>
            </div>
            <span className={`text-xl font-bold transition-colors duration-300 ${
              isScrolled || isMenuOpen || pathname !== '/' 
                ? 'text-slate-900 dark:text-white' 
                : 'text-white'
            }`}>
              RISING BS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center h-full">
            <ul className="flex h-full">
              <li>
                <button 
                  onClick={() => scrollToSection('services')}
                  className={`h-full flex items-center px-4 font-medium transition-colors duration-300 ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-700 hover:text-orange-600 dark:text-slate-300 dark:hover:text-orange-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Dienstleistungen
                </button>
              </li>
              
              <li>
                <button 
                  onClick={() => scrollToSection('about')}
                  className={`h-full flex items-center px-4 font-medium transition-colors duration-300 ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-700 hover:text-orange-600 dark:text-slate-300 dark:hover:text-orange-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Über uns
                </button>
              </li>
              
              <li>
                <button 
                  onClick={() => scrollToSection('features')}
                  className={`h-full flex items-center px-4 font-medium transition-colors duration-300 ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-700 hover:text-orange-600 dark:text-slate-300 dark:hover:text-orange-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Unser Konzept
                </button>
              </li>
              
              <li>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className={`h-full flex items-center px-4 font-medium transition-colors duration-300 ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-700 hover:text-orange-600 dark:text-slate-300 dark:hover:text-orange-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Kontakt
                </button>
              </li>
            </ul>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Theme Toggle */}
            {mounted && (
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isScrolled || pathname !== '/' 
                    ? 'text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}
            
            {/* Dashboard / Login Button */}
            <Link 
              href={isAuthenticated ? "/dashboard" : "/auth/login"}
              className={`hidden md:flex items-center px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                isScrolled || pathname !== '/' 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg hover:shadow-orange-500/20' 
                  : 'bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border border-white/25'
              }`}
            >
              {isAuthenticated ? 'Dashboard' : 'Anmelden'}
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 rounded-full transition-colors duration-300 ${
                isScrolled || pathname !== '/' 
                  ? 'text-slate-600 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6">
              <nav className="space-y-1">
                <button 
                  onClick={() => {
                    scrollToSection('services');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                >
                  Dienstleistungen
                </button>
                
                <button 
                  onClick={() => {
                    scrollToSection('about');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                >
                  Über uns
                </button>
                
                <button 
                  onClick={() => {
                    scrollToSection('features');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                >
                  Unser Konzept
                </button>
                
                <button 
                  onClick={() => {
                    scrollToSection('contact');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                >
                  Kontakt
                </button>
                
                {/* Mobile Sign In / Dashboard Button */}
                <div className="pt-4">
                  <Link 
                    href={isAuthenticated ? "/dashboard" : "/auth/login"}
                    className="block w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg text-center shadow-md transition-colors duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {isAuthenticated ? 'Dashboard' : 'Anmelden'}
                  </Link>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;