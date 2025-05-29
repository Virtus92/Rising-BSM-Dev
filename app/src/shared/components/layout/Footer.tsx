'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Instagram, Youtube, ArrowUp, Mail, Phone, MapPin, Heart, MessageCircle, Clock } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

/**
 * Modern Footer component with Tailwind CSS showcase
 */
const Footer = () => {
  const { settings } = useSettings();
  
  // Scroll to top function
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950 text-white overflow-hidden relative">
      {/* Background gradient decorations */}
      <div 
        className="absolute top-0 left-0 w-64 h-64 rounded-full bg-orange-500 opacity-10 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      ></div>
      <div 
        className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-blue-500 opacity-10 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      ></div>
      
      {/* Wave decoration at the top */}
      <div className="relative w-full">
        <svg className="w-full h-auto transform translate-y-1" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 120L48 105C96 90 192 60 288 54C384 48 480 66 576 72C672 78 768 72 864 60C960 48 1056 30 1152 30C1248 30 1344 48 1392 57L1440 66V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" 
                fill="currentColor" className="text-white dark:text-slate-950"/>
        </svg>
      </div>

      <div className="container mx-auto px-4 pt-16 pb-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="relative overflow-hidden rounded-full w-10 h-10 flex items-center justify-center bg-gradient-to-br from-orange-500 to-blue-500">
                <span className="font-bold text-white text-lg">R</span>
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-orange-200">
                RISING BS e.U.
              </span>
            </div>
            
            <p className="text-slate-300 leading-relaxed">
              Ihr zuverlässiger Partner für Gebäudebetreuung, Winterdienst, Grünflächenpflege und vieles mehr in Linz und Umgebung.
            </p>
            
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/bsrising" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-white transition-colors duration-300 hover:scale-110 transform"
                aria-label="Instagram"
              >
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a 
                href="https://wa.me/4368184030694" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-white transition-colors duration-300 hover:scale-110 transform"
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
                <span className="sr-only">WhatsApp</span>
              </a>
              <a 
                href="https://www.youtube.com/@risingbs" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-white transition-colors duration-300 hover:scale-110 transform"
                aria-label="YouTube"
              >
                <Youtube size={20} />
                <span className="sr-only">YouTube</span>
              </a>
            </div>
          </div>

          {/* Dienstleistungen */}
          <div>
            <h3 className="text-xl font-bold mb-6 relative">
              <span className="relative z-10">Dienstleistungen</span>
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-orange-500 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/#services" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Winterdienst
                </Link>
              </li>
              <li>
                <Link href="/#services" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Grünflächenbetreuung
                </Link>
              </li>
              <li>
                <Link href="/#services" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Reinigung
                </Link>
              </li>
              <li>
                <Link href="/#services" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Umzüge & Transporte
                </Link>
              </li>
              <li>
                <Link href="/#services" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Kranführer
                </Link>
              </li>
            </ul>
          </div>

          {/* Unternehmen */}
          <div>
            <h3 className="text-xl font-bold mb-6 relative">
              <span className="relative z-10">Unternehmen</span>
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-orange-500 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/#about" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/#team" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Team
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/agb" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  AGB
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Impressum
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-xl font-bold mb-6 relative">
              <span className="relative z-10">Kontakt</span>
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-orange-500 rounded-full"></span>
            </h3>
            <address className="not-italic space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <MapPin size={16} className="text-orange-400" />
                  </div>
                </div>
                <div className="ml-4 text-slate-300">
                  <p>Waldmüllergang 10a</p>
                  <p>4020 Linz, Österreich</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Phone size={16} className="text-orange-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <a href="tel:+4368184030694" className="text-slate-300 hover:text-white transition-colors duration-300">
                    +43 681 840 30 694
                  </a>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Mail size={16} className="text-orange-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <a href="mailto:info.risingbs@gmail.com" className="text-slate-300 hover:text-white transition-colors duration-300">
                    info.risingbs@gmail.com
                  </a>
                </div>
              </div>
            </address>
          </div>
        </div>

        {/* Öffnungszeiten */}
        <div className="mt-16 lg:mt-20 py-8 border-t border-slate-800 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h4 className="text-xl font-bold mb-3 flex items-center">
              <Clock className="mr-2" size={24} />
              Öffnungszeiten
            </h4>
            <p className="text-slate-400">Montag - Freitag: 09:00 - 18:00 Uhr</p>
            <p className="text-slate-400">Samstag & Sonntag: Nach Vereinbarung</p>
            <p className="text-orange-400 mt-2">24/7 Notfallservice verfügbar</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold mb-2">Kostenlose Beratung</p>
            <p className="text-slate-400 mb-4">Lassen Sie sich unverbindlich beraten</p>
            <a
              href="tel:+4368184030694"
              className="inline-flex items-center bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-medium transition-colors duration-300"
            >
              <Phone className="mr-2" size={18} />
              Jetzt anrufen
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="text-slate-400 text-sm">
            © {new Date().getFullYear()} RISING BS e.U. Alle Rechte vorbehalten.
          </div>
          
          <div className="flex items-center text-slate-400 text-sm">
            <span>Ihre Zufriedenheit ist unser Maßstab </span>
            <Heart size={14} className="mx-1 text-rose-500" />
          </div>
          
          <button
            onClick={scrollToTop}
            className="md:self-auto self-end group p-3 rounded-full bg-slate-800 hover:bg-orange-600 text-white transition-colors duration-300"
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} className="group-hover:animate-bounce" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
