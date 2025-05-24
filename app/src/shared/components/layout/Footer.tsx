'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, ArrowUp, Mail, Phone, MapPin, Github, Heart, Users, Calendar, MessageSquare, BarChart3, BookOpen, FileText, Shield, Headphones, ExternalLink, Star, ChevronRight, LayoutDashboard } from 'lucide-react';
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
    <footer className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white overflow-hidden relative">
      {/* Background gradient decorations */}
      <div 
        className="absolute top-0 left-0 w-64 h-64 rounded-full bg-indigo-500 opacity-10 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      ></div>
      <div 
        className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-green-500 opacity-10 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"
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
              <div className="relative overflow-hidden rounded-full w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-green-400">
                <span className="font-bold text-white text-lg">R</span>
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                {settings?.companyName || 'Rising BSM'}
              </span>
            </div>
            
            <p className="text-slate-300 leading-relaxed">
              Open source platform for business service management with AI-powered assistants handling requests, customer management, and appointments.
            </p>
            
            <div className="flex space-x-4">
              <a 
                href={settings?.socialLinks?.github || "https://github.com"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-white transition-colors duration-300 hover:scale-110 transform"
                aria-label="GitHub"
              >
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </a>
              <a 
                href={settings?.socialLinks?.twitter || "https://twitter.com"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-white transition-colors duration-300 hover:scale-110 transform"
                aria-label="Twitter"
              >
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
              <a 
                href={settings?.socialLinks?.linkedin || "https://linkedin.com"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-white transition-colors duration-300 hover:scale-110 transform"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-xl font-bold mb-6 relative">
              <span className="relative z-10">Products</span>
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-indigo-500 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/#features" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Customer Management
                </Link>
              </li>
              <li>
                <Link href="/#features" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Request Handling
                </Link>
              </li>
              <li>
                <Link href="/#features" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Appointment Scheduling
                </Link>
              </li>
              <li>
                <Link href="/#features" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Analytics & Reporting
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xl font-bold mb-6 relative">
              <span className="relative z-10">Resources</span>
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-indigo-500 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/#request" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Request Demo
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="group flex items-center text-slate-300 hover:text-white transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-6 relative">
              <span className="relative z-10">Contact</span>
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-indigo-500 rounded-full"></span>
            </h3>
            <address className="not-italic space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <MapPin size={16} className="text-indigo-400" />
                  </div>
                </div>
                <div className="ml-4 text-slate-300">
                  <p>Waldmüllergang 10a</p>
                  <p>4020 Linz, Austria</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Phone size={16} className="text-indigo-400" />
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
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Mail size={16} className="text-indigo-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <a href="mailto:info@rising-bsm.at" className="text-slate-300 hover:text-white transition-colors duration-300">
                    info@rising-bsm.at
                  </a>
                </div>
              </div>
            </address>
          </div>
        </div>

        {/* Newsletter (optional) */}
        <div className="mt-16 lg:mt-20 py-8 border-t border-slate-800 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h4 className="text-xl font-bold mb-3">Stay up to date</h4>
            <p className="text-slate-400">Get updates on new features and releases</p>
          </div>
          <div>
            <form className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-r-lg font-medium transition-colors duration-300"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="text-slate-400 text-sm">
            © {new Date().getFullYear()} {settings?.companyName || 'Rising BSM'}. All rights reserved.
          </div>
          
          <div className="flex items-center text-slate-400 text-sm">
            <span>Made with </span>
            <Heart size={14} className="mx-1 text-rose-500" />
            <span> for open source</span>
          </div>
          
          <button
            onClick={scrollToTop}
            className="md:self-auto self-end group p-3 rounded-full bg-slate-800 hover:bg-indigo-600 text-white transition-colors duration-300"
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
