'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md dark:bg-slate-900' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className={`text-2xl font-bold ${isScrolled || isMenuOpen ? 'text-green-600 dark:text-green-500' : 'text-white'}`}>
              Rising BSM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`font-medium transition ${isScrolled ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' : 'text-white hover:text-green-400'}`}>
              Home
            </Link>
            <Link href="/#services" className={`font-medium transition ${isScrolled ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' : 'text-white hover:text-green-400'}`}>
              Leistungen
            </Link>
            <Link href="/#about" className={`font-medium transition ${isScrolled ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' : 'text-white hover:text-green-400'}`}>
              Über uns
            </Link>
            <Link href="/#contact" className={`font-medium transition ${isScrolled ? 'text-slate-800 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-500' : 'text-white hover:text-green-400'}`}>
              Kontakt
            </Link>
            <Link href="/dashboard" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition">
              Dashboard
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className={isScrolled ? 'text-slate-800 dark:text-white' : 'text-white'} size={24} />
            ) : (
              <Menu className={isScrolled ? 'text-slate-800 dark:text-white' : 'text-white'} size={24} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link href="/#services" className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition" onClick={() => setIsMenuOpen(false)}>
                Leistungen
              </Link>
              <Link href="/#about" className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition" onClick={() => setIsMenuOpen(false)}>
                Über uns
              </Link>
              <Link href="/#contact" className="text-slate-800 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-500 transition" onClick={() => setIsMenuOpen(false)}>
                Kontakt
              </Link>
              <Link 
                href="/dashboard"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;