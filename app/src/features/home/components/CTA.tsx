'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, ArrowRight, MessageCircle, Calendar } from 'lucide-react';

/**
 * CTA (Call-to-Action) component for the landing page
 * 
 * Provides compelling calls to action to encourage potential
 * customers to contact RISING BS e.U.
 */
const CTA = () => {
  const ctaRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }

    return () => {
      if (ctaRef.current) {
        observer.unobserve(ctaRef.current);
      }
    };
  }, []);

  return (
    <section ref={ctaRef} className="py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-blue-600 -z-10" />
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: "url('/images/grid-pattern.svg')" }} />
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Bereit für das Rundum-Sorglos-Paket?
            </h2>
            
            <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto">
              Lassen Sie uns gemeinsam Ihre Immobilie in besten Händen wissen. RISING BS e.U. - Ihr zuverlässiger Partner für alle Fälle.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="tel:+4368184030694" 
                className="bg-white hover:bg-orange-50 text-orange-600 px-8 py-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 font-medium text-lg flex items-center justify-center"
              >
                <Phone className="mr-2 w-5 h-5" />
                <span>Jetzt anrufen</span>
              </a>
              
              <a 
                href="#contact" 
                className="bg-orange-700 hover:bg-orange-800 text-white px-8 py-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 font-medium text-lg flex items-center justify-center"
              >
                <Mail className="mr-2 w-5 h-5" />
                <span>Kostenloses Angebot</span>
              </a>
            </div>
          </div>
          
          {/* Features highlight */}
          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            style={{ 
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              transitionDelay: '300ms'
            }}
          >
            {[
              {
                title: "24/7 Bereitschaft",
                description: "Rund um die Uhr für Sie erreichbar - besonders wichtig beim Winterdienst."
              },
              {
                title: "Faire Preise",
                description: "Transparente Kalkulation und individuelle Angebote für jedes Budget."
              },
              {
                title: "Alles aus einer Hand",
                description: "Vom Winterdienst bis zur Kranführung - wir sind Ihr Komplettanbieter."
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                style={{ 
                  transitionDelay: `${400 + index * 100}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease'
                }}
              >
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-orange-100">{feature.description}</p>
              </div>
            ))}
          </div>
          
          {/* Contact options */}
          <div 
            className="mt-16 bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-2xl overflow-hidden mx-auto max-w-3xl"
            style={{ 
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              transitionDelay: '700ms'
            }}
          >
            <h3 className="text-2xl font-bold mb-6 text-white text-center">
              So erreichen Sie uns
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">Telefon</h4>
                <a href="tel:+4368184030694" className="text-orange-100 hover:text-white transition">
                  +43 681 840 30 694
                </a>
              </div>
              
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">E-Mail</h4>
                <a href="mailto:info.risingbs@gmail.com" className="text-orange-100 hover:text-white transition">
                  info.risingbs@gmail.com
                </a>
              </div>
              
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-1">Öffnungszeiten</h4>
                <p className="text-orange-100">
                  Mo-Fr: 09:00 - 18:00
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/20 text-center">
              <span className="text-white">Wir antworten innerhalb von 24 Stunden!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
