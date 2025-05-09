'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Moon, Sun, ChevronDown, Star, Sparkles, Code, Shield, Users, Calendar } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modern Header component for the landing page
 * Showcases advanced Tailwind features with animations
 */
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showResources, setShowResources] = useState(false);
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
    setShowProducts(false);
    setShowResources(false);
    
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

  // Products megamenu data
  const products = [
    {
      icon: <Star className="h-5 w-5 text-amber-500" />,
      name: "Customer Management",
      description: "Comprehensive CRM with customer profiles",
      path: "/#features"
    },
    {
      icon: <Calendar className="h-5 w-5 text-indigo-500" />,
      name: "Appointment Scheduling",
      description: "Smart calendar with automated reminders",
      path: "/#features"
    },
    {
      icon: <Sparkles className="h-5 w-5 text-emerald-500" />,
      name: "Smart Notifications",
      description: "Automated alerts for important events",
      path: "/#features"
    },
    {
      icon: <Shield className="h-5 w-5 text-rose-500" />,
      name: "Role-Based Access",
      description: "Granular permissions system for teams",
      path: "/#features"
    }
  ];

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
            <div className="relative overflow-hidden rounded-full w-8 h-8 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-green-400">
              <span className="font-bold text-white text-sm">R</span>
            </div>
            <span className={`text-xl font-bold transition-colors duration-300 ${
              isScrolled || isMenuOpen || pathname !== '/' 
                ? 'text-slate-900 dark:text-white' 
                : 'text-white'
            }`}>
              {settings?.companyName || 'Rising BSM'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center h-full">
            <ul className="flex h-full">
              <li className="relative h-full">
                <button 
                  onMouseEnter={() => setShowProducts(true)}
                  onMouseLeave={() => setShowProducts(false)}
                  onClick={() => setShowProducts(!showProducts)}
                  className={`h-full flex items-center px-4 font-medium transition-colors duration-300 ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Products
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-300 ${showProducts ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Products Dropdown (Mega Menu) */}
                <AnimatePresence>
                  {showProducts && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setShowProducts(true)}
                      onMouseLeave={() => setShowProducts(false)}
                      className="absolute top-full left-0 w-[32rem] pt-2 group"
                    >
                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 grid grid-cols-2 gap-4">
                        {products.map((product, idx) => (
                          <Link 
                            key={idx}
                            href={product.path}
                            className="flex p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-300"
                          >
                            <div className="shrink-0 mr-4 h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                              {product.icon}
                            </div>
                            <div>
                              <h3 className="font-medium text-slate-900 dark:text-white mb-1">{product.name}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{product.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
              
              <li>
                <button 
                  onClick={() => scrollToSection('features')}
                  className={`h-full flex items-center px-4 font-medium transition-colors duration-300 ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Features
                </button>
              </li>
              
              <li>
                <button 
                  onClick={() => scrollToSection('about')}
                  className={`h-full flex items-center px-4 font-medium transition-colors duration-300 ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  About
                </button>
              </li>
              
              <li className="relative h-full">
                <button 
                  onMouseEnter={() => setShowResources(true)}
                  onMouseLeave={() => setShowResources(false)}
                  onClick={() => setShowResources(!showResources)}
                  className={`h-full flex items-center px-4 font-medium transition-colors duration-300 ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Resources
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-300 ${showResources ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Resources Dropdown */}
                <AnimatePresence>
                  {showResources && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setShowResources(true)}
                      onMouseLeave={() => setShowResources(false)}
                      className="absolute top-full left-0 w-64 pt-2"
                    >
                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3">
                        <div className="space-y-1">
                          <Link
                            href="/#faq"
                            className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200 rounded-lg transition-colors duration-300"
                            onClick={() => setShowResources(false)}
                          >
                            FAQ
                          </Link>
                          <Link
                            href="/#request"
                            className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200 rounded-lg transition-colors duration-300"
                            onClick={() => setShowResources(false)}
                          >
                            Request Demo
                          </Link>
                          <Link
                            href="https://github.com"
                            target="_blank"
                            className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200 rounded-lg transition-colors duration-300"
                            onClick={() => setShowResources(false)}
                          >
                            GitHub Repository
                          </Link>
                          <hr className="my-1 border-slate-200 dark:border-slate-700" />
                          <Link
                            href="/contact"
                            className="block px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200 rounded-lg transition-colors duration-300"
                            onClick={() => setShowResources(false)}
                          >
                            Contact Support
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
              
              <li>
                <button 
                  onClick={() => scrollToSection('request')}
                  className={`h-full flex items-center px-4 font-medium transition-colors duration-300 ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Contact
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
                    ? 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800' 
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
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg hover:shadow-indigo-500/20' 
                  : 'bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border border-white/25'
              }`}
            >
              {isAuthenticated ? 'Dashboard' : 'Sign In'}
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 rounded-full transition-colors duration-300 ${
                isScrolled || pathname !== '/' 
                  ? 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800' 
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
              <nav className="space-y-6">
                {/* Mobile Products Section */}
                <div>
                  <div 
                    className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 cursor-pointer"
                    onClick={() => setShowProducts(!showProducts)}
                  >
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Products</h3>
                    <ChevronDown className={`h-5 w-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${showProducts ? 'rotate-180' : ''}`} />
                  </div>
                  
                  <AnimatePresence>
                    {showProducts && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pt-3 pb-2 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 gap-2">
                          {products.map((product, idx) => (
                            <Link 
                              key={idx}
                              href={product.path}
                              className="flex items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3">
                                {product.icon}
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-white">{product.name}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{product.description}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Mobile Navigation Links */}
                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      scrollToSection('features');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                  >
                    Features
                  </button>
                  
                  <button 
                    onClick={() => {
                      scrollToSection('about');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                  >
                    About
                  </button>
                  
                  {/* Mobile Resources Dropdown */}
                  <div>
                    <div 
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
                      onClick={() => setShowResources(!showResources)}
                    >
                      <span>Resources</span>
                      <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${showResources ? 'rotate-180' : ''}`} />
                    </div>
                    
                    <AnimatePresence>
                      {showResources && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-1 py-2"
                        >
                          <Link
                            href="/#faq"
                            className="block px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            FAQ
                          </Link>
                          <Link
                            href="/#request"
                            className="block px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Request Demo
                          </Link>
                          <Link
                            href="https://github.com"
                            target="_blank"
                            className="block px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            GitHub Repository
                          </Link>
                          <Link
                            href="/contact"
                            className="block px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Contact Support
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <button 
                    onClick={() => {
                      scrollToSection('request');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                  >
                    Contact
                  </button>
                </div>
                
                {/* Mobile Sign In / Dashboard Button */}
                <div className="pt-2">
                  <Link 
                    href={isAuthenticated ? "/dashboard" : "/auth/login"}
                    className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-center shadow-md transition-colors duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {isAuthenticated ? 'Dashboard' : 'Sign In'}
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
