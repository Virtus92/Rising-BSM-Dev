'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Snowflake, TreePine, Sparkles, Home, Phone, Mail, Truck, Wrench } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

/**
 * Hero component for Rising BS e.U.
 * 
 * Features comprehensive facility management services
 * with focus on quality, innovation and customer satisfaction.
 */
const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: "Ihre Zufriedenheit ist unser Maßstab",
      subtitle: "Professionelle Gebäudebetreuung in Linz und Umgebung",
      highlight: "RISING BS e.U. - Ihr Partner für alle Fälle"
    },
    {
      title: "Winterdienst rund um die Uhr",
      subtitle: "Schneeräumung und Streuung für sichere Wege",
      highlight: "24/7 Bereitschaft bei Schneefall"
    },
    {
      title: "Rundum-Sorglos-Paket",
      subtitle: "Von Grünflächenpflege bis Hausbetreuung",
      highlight: "Alles aus einer Hand"
    }
  ];
  
  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-28 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 -z-10" />
      
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:space-x-12">
          {/* Left column: Text content */}
          <div 
            className={`lg:w-1/2 lg:pr-8 mb-12 lg:mb-0 transition-all duration-1000 ease-out transform ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-block mb-4 px-4 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
              {slides[currentSlide].highlight}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-800 dark:text-slate-100">
              {slides[currentSlide].title}
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 font-medium">
              {slides[currentSlide].subtitle}
            </p>
            
            <div className="flex flex-wrap gap-4 mb-10">
              {[
                { icon: <Snowflake className="w-5 h-5 mr-2" />, text: "Winterdienst" },
                { icon: <TreePine className="w-5 h-5 mr-2" />, text: "Grünflächenbetreuung" },
                { icon: <Sparkles className="w-5 h-5 mr-2" />, text: "Reinigung" },
                { icon: <Home className="w-5 h-5 mr-2" />, text: "Hausbetreuung" },
                { icon: <Truck className="w-5 h-5 mr-2" />, text: "Umzüge & Transporte" },
                { icon: <Wrench className="w-5 h-5 mr-2" />, text: "Kranführer" }
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm text-slate-700 dark:text-slate-200"
                  style={{ 
                    transitionDelay: `${(index + 1) * 150}ms`,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease'
                  }}
                >
                  {feature.icon}
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
            
            <div 
              className="flex flex-wrap gap-4" 
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
                transitionDelay: '600ms'
              }}
            >
              <Link 
                href="#services" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg shadow-md transition flex items-center justify-center space-x-2 text-lg"
              >
                <span>Unsere Leistungen</span>
                <ArrowRight size={20} />
              </Link>
              
              <a 
                href="tel:+4368184030694" 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition flex items-center justify-center space-x-2 text-lg"
              >
                <Phone size={20} />
                <span>+43 681 840 30 694</span>
              </a>
            </div>
          </div>
          
          {/* Right column: Image/Illustration */}
          <div 
            className={`lg:w-1/2 transition-all duration-1000 ease-out delay-300 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-300 dark:bg-yellow-500/20 rounded-lg blur-2xl opacity-30 animate-pulse"></div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-indigo-300 dark:bg-indigo-500/20 rounded-lg blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="relative pt-3 px-3 pb-0 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <div className="flex gap-1.5 absolute left-3 top-3">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="h-4"></div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 p-8 min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <Home className="w-16 h-16 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">RISING BS e.U.</h3>
                    <p className="text-slate-600 dark:text-slate-400">Ihr verlässlicher Partner für alle Fälle</p>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div 
                className="absolute -right-4 top-1/4 bg-white dark:bg-slate-700 shadow-lg rounded-lg p-4 animate-float"
                style={{ 
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                  transitionDelay: '900ms',
                  animation: 'float 6s ease-in-out infinite'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">24/7 Erreichbar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Schnelle Hilfe garantiert</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats section */}
        <div 
          className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8"
          style={{ 
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            transitionDelay: '1000ms'
          }}
        >
          {[
            { label: "Zufriedene Kunden", value: "96" },
            { label: "Abgeschlossene Projekte", value: "156" },
            { label: "Leistungsversprechen", value: "100%" },
            { label: "Servicebereiche", value: "6+" }
          ].map((stat, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700 text-center hover:shadow-lg transition-shadow">
              <div className="text-3xl font-bold mb-2 text-orange-600 dark:text-orange-400">{stat.value}</div>
              <div className="text-slate-600 dark:text-slate-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;
