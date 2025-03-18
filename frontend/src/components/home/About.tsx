'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const About = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add counting animation to stats when in view
          animateStats();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    
    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  const animateStats = () => {
    const statsElements = document.querySelectorAll('.stat-value');
    
    statsElements.forEach(element => {
      const target = parseInt(element.textContent || '0', 10);
      let count = 0;
      const duration = 2000; // ms
      const frameDuration = 1000 / 60; // 60fps
      const totalFrames = Math.round(duration / frameDuration);
      const increment = target / totalFrames;
      
      const counter = setInterval(() => {
        count += increment;
        
        if (count >= target) {
          element.textContent = target.toString();
          clearInterval(counter);
        } else {
          element.textContent = Math.floor(count).toString();
        }
      }, frameDuration);
    });
  };

  return (
    <section id="about" className="section-padding">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/us.jpg"
                alt="Rising BSM Team"
                width={600}
                height={450}
                className="object-cover w-full"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-gray-100 dark:bg-slate-700 rounded-lg shadow-lg hidden md:flex items-center justify-center">
              <span className="text-green-600 font-bold text-5xl">13+</span>
              <span className="text-gray-700 dark:text-gray-300 block text-center mt-2">Jahre Erfahrung</span>
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Über Rising BSM</h2>
            
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
              Seit 2010 bieten wir maßgeschneiderte Lösungen für Gewerbe und Privatkunden. Unsere Expertise umfasst ein breites Spektrum an Dienstleistungen rund um Facility Management, Transporte und Außenanlagenpflege.
            </p>
            
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-8">
              Was uns auszeichnet ist unsere Flexibilität, Zuverlässigkeit und unser Engagement für Qualität. Wir setzen auf langfristige Kundenbeziehungen und transparente Kommunikation.
            </p>
            
            <div ref={statsRef} className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <div className="text-green-600 font-bold text-3xl mb-1 stat-value">100</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Zufriedene Kunden</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <div className="text-green-600 font-bold text-3xl mb-1 stat-value">200</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Abgeschlossene Projekte</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <div className="text-green-600 font-bold text-3xl mb-1 stat-value">100</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">% Kundenzufriedenheit</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;