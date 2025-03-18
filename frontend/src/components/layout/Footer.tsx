'use client'

import Link from 'next/link';
import { Facebook, Instagram, Linkedin, ArrowUp } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Rising BSM</h3>
            <p className="text-gray-400 mb-4">
              Professionelle Dienstleistungen rund um Facility Management, Umzüge & Transporte sowie Sommer- & Winterdienst.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-4">Leistungen</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#services" className="text-gray-400 hover:text-white transition">
                  Facility Management
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-gray-400 hover:text-white transition">
                  Umzüge & Transporte
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-gray-400 hover:text-white transition">
                  Sommer- & Winterdienst
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Schnellzugriff</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-gray-400 hover:text-white transition">
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-gray-400 hover:text-white transition">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="text-gray-400 hover:text-white transition">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-gray-400 hover:text-white transition">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Kontakt</h3>
            <address className="not-italic text-gray-400">
              <p className="mb-2">Waldmüllergang 10a</p>
              <p className="mb-2">4020 Linz</p>
              <p className="mb-2">
                <a href="tel:+4368184030694" className="hover:text-white transition">
                  +43 681 840 30 694
                </a>
              </p>
              <p>
                <a href="mailto:info@rising-bsm.at" className="hover:text-white transition">
                  info@rising-bsm.at
                </a>
              </p>
            </address>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="text-gray-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} Rising BSM. Alle Rechte vorbehalten.
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