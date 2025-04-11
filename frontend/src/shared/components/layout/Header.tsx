'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useSettings } from '@/shared/contexts/SettingsContext';

/**
 * Header-Komponente für die Landing Page
 */
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();

  // Prüft, ob ein Link aktiv ist (optionale Tiefen-Prüfung)
  const isActive = useCallback((path: string, exact = false) => {
    if (exact) return pathname === path;
    return pathname?.startsWith(path);
  }, [pathname]);

  // Scroll-Handler für transparenten Header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    handleScroll(); // Initial prüfen
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hydration-Schutz für Theme-Toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme wechseln
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Menü schließen und zu einer Sektion scrollen
  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // Header-Höhe berücksichtigen
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled || pathname !== '/' 
        ? 'bg-white shadow-md dark:bg-slate-900' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className={`text-2xl font-bold ${
              isScrolled || isMenuOpen || pathname !== '/' 
                ? 'text-green-600 dark:text-green-500' 
                : 'text-white'
            }`}>
              {settings?.companyName || 'Rising BSM'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`font-medium transition ${
                isActive('/', true) 
                  ? 'text-green-600 dark:text-green-500' 
                  : isScrolled || pathname !== '/' 
                    ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' 
                    : 'text-white hover:text-green-400'
              }`}
            >
              Home
            </Link>
            
            {pathname === '/' ? (
              <>
                <button 
                  onClick={() => scrollToSection('services')}
                  className={`font-medium transition ${
                    isScrolled 
                      ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' 
                      : 'text-white hover:text-green-400'
                  }`}
                >
                  Leistungen
                </button>
                
                <button 
                  onClick={() => scrollToSection('about')}
                  className={`font-medium transition ${
                    isScrolled 
                      ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' 
                      : 'text-white hover:text-green-400'
                  }`}
                >
                  Über uns
                </button>
                
                <button 
                  onClick={() => scrollToSection('contact')}
                  className={`font-medium transition ${
                    isScrolled 
                      ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' 
                      : 'text-white hover:text-green-400'
                  }`}
                >
                  Kontakt
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/#services" 
                  className={`font-medium transition ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' 
                      : 'text-white hover:text-green-400'
                  }`}
                >
                  Leistungen
                </Link>
                
                <Link 
                  href="/#about" 
                  className={`font-medium transition ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' 
                      : 'text-white hover:text-green-400'
                  }`}
                >
                  Über uns
                </Link>
                
                <Link 
                  href="/#contact" 
                  className={`font-medium transition ${
                    isScrolled || pathname !== '/' 
                      ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' 
                      : 'text-white hover:text-green-400'
                  }`}
                >
                  Kontakt
                </Link>
              </>
            )}
            
            {/* Theme Toggle */}
            {mounted && (
              <button 
                onClick={toggleTheme}
                className={`p-1 rounded-md transition ${
                  isScrolled || pathname !== '/' 
                    ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' 
                    : 'text-white hover:text-green-400'
                }`}
                aria-label={theme === 'dark' ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln'}
              >
                {theme === 'dark' ? (
                  <Sun size={20} />
                ) : (
                  <Moon size={20} />
                )}
              </button>
            )}
            
            {/* Dashboard / Login */}
            <Link 
              href={isAuthenticated ? "/dashboard" : "/auth/login"}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
            >
              {isAuthenticated ? 'Dashboard' : 'Login'}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-3">
            {/* Theme Toggle */}
            {mounted && (
              <button 
                onClick={toggleTheme}
                className={`p-1 rounded-md transition ${
                  isScrolled || pathname !== '/' 
                    ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' 
                    : 'text-white hover:text-green-400'
                }`}
                aria-label={theme === 'dark' ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln'}
              >
                {theme === 'dark' ? (
                  <Sun size={20} />
                ) : (
                  <Moon size={20} />
                )}
              </button>
            )}
            
            <button
              className="focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
            >
              {isMenuOpen ? (
                <X className={isScrolled || pathname !== '/' ? 'text-slate-800 dark:text-white' : 'text-white'} size={24} />
              ) : (
                <Menu className={isScrolled || pathname !== '/' ? 'text-slate-800 dark:text-white' : 'text-white'} size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className={`text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition ${
                  isActive('/', true) ? 'text-green-600 dark:text-green-500' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {pathname === '/' ? (
                <>
                  <button 
                    onClick={() => scrollToSection('services')}
                    className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition text-left"
                  >
                    Leistungen
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection('about')}
                    className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition text-left"
                  >
                    Über uns
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition text-left"
                  >
                    Kontakt
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/#services" 
                    className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Leistungen
                  </Link>
                  
                  <Link 
                    href="/#about" 
                    className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Über uns
                  </Link>
                  
                  <Link 
                    href="/#contact" 
                    className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Kontakt
                  </Link>
                </>
              )}
              
              <Link 
                href={isAuthenticated ? "/dashboard" : "/auth/login"}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {isAuthenticated ? 'Dashboard' : 'Login'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
