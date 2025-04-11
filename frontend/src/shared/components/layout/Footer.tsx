'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, ArrowUp, Mail, Phone, MapPin } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

/**
 * Footer-Komponente für die Landing Page
 */
const Footer = () => {
  const { settings } = useSettings();
  
  // Scroll zum Seitenanfang
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Firmeninformationen */}
          <div>
            <h3 className="text-xl font-bold mb-4">{settings?.companyName || 'Rising BSM'}</h3>
            <p className="text-gray-400 mb-4">
              Professionelle Dienstleistungen rund um Facility Management, Umzüge & Transporte sowie Sommer- & Winterdienst.
            </p>
            <div className="flex space-x-4">
              <a 
                href={settings?.socialLinks?.facebook || "https://facebook.com"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition"
                aria-label="Facebook"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a 
                href={settings?.socialLinks?.instagram || "https://instagram.com"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition"
                aria-label="Instagram"
              >
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a 
                href={settings?.socialLinks?.linkedin || "https://linkedin.com"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Leistungen */}
          <div>
            <h3 className="text-xl font-bold mb-4">Leistungen</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#services" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Facility Management
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Umzüge & Transporte
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Sommer- & Winterdienst
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Grünflächenbetreuung
                </Link>
              </li>
            </ul>
          </div>

          {/* Schnellzugriff */}
          <div>
            <h3 className="text-xl font-bold mb-4">Schnellzugriff</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-gray-400 hover:text-white transition group flex items-center">
                  <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-xl font-bold mb-4">Kontakt</h3>
            <address className="not-italic text-gray-400 space-y-3">
              <div className="flex items-start">
                <MapPin size={18} className="mr-2 mt-1 text-green-500" />
                <div>
                  <p>Waldmüllergang 10a</p>
                  <p>4020 Linz</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Phone size={18} className="mr-2 text-green-500" />
                <a href="tel:+4368184030694" className="hover:text-white transition">
                  +43 681 840 30 694
                </a>
              </div>
              
              <div className="flex items-center">
                <Mail size={18} className="mr-2 text-green-500" />
                <a href="mailto:info@rising-bsm.at" className="hover:text-white transition">
                  info@rising-bsm.at
                </a>
              </div>
            </address>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="text-gray-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} {settings?.companyName || 'Rising BSM'}. Alle Rechte vorbehalten.
          </div>
          <button
            onClick={scrollToTop}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full self-end md:self-auto transition"
            aria-label="Nach oben scrollen"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
