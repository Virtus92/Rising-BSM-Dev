'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Award, Heart, Shield, Users, Target, Leaf } from 'lucide-react';

/**
 * About component for Rising BS e.U.
 * 
 * Explains the company values, mission and philosophy
 * with focus on quality, innovation and customer satisfaction.
 */
const About = () => {
  const aboutRef = useRef<HTMLDivElement>(null);
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

    if (aboutRef.current) {
      observer.observe(aboutRef.current);
    }

    return () => {
      if (aboutRef.current) {
        observer.unobserve(aboutRef.current);
      }
    };
  }, []);

  return (
    <section id="about" ref={aboutRef} className="py-20 bg-slate-50 dark:bg-slate-800/50">
      <div className="container px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column: Image & values */}
          <div 
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-indigo-300 dark:bg-indigo-500/20 rounded-lg blur-2xl opacity-30"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-cyan-300 dark:bg-cyan-500/20 rounded-lg blur-2xl opacity-30"></div>
              
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Unsere Werte</h3>
                  <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-medium px-3 py-1 rounded-full">
                    RISING BS e.U.
                  </div>
                </div>
                
                <div className="space-y-6">
                  {[
                    {
                      icon: <Shield className="w-5 h-5" />,
                      title: "Qualität & Innovation",
                      description: "Höchste Qualitätsstandards und innovative Lösungen für optimale Ergebnisse in allen Bereichen."
                    },
                    {
                      icon: <Heart className="w-5 h-5" />,
                      title: "Kundenzufriedenheit",
                      description: "Ihre Zufriedenheit ist unser Maßstab - individuelle Betreuung und maßgeschneiderte Lösungen."
                    },
                    {
                      icon: <Leaf className="w-5 h-5" />,
                      title: "Nachhaltigkeit",
                      description: "Umweltfreundliche Verfahren und nachhaltige Praktiken für eine bessere Zukunft."
                    }
                  ].map((value, index) => (
                    <div 
                      key={index} 
                      className="flex items-start"
                      style={{ 
                        transitionDelay: `${300 + index * 100}ms`,
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.5s ease, transform 0.5s ease'
                      }}
                    >
                      <div className="bg-gradient-to-br from-orange-500 to-blue-600 p-3 rounded-lg text-white mr-4 flex-shrink-0">
                        {value.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">{value.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400">{value.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Text content */}
          <div 
            className={`transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Über <span className="text-orange-600 dark:text-orange-400">RISING BS e.U.</span>
              </h2>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                RISING BS e.U. ist Ihr kompetenter Partner für professionelle Dienstleistungen in Linz und Umgebung. Mit unserem umfassenden Leistungsspektrum bieten wir Ihnen alles aus einer Hand.
              </p>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                Unser Unternehmen steht für Qualität, Zuverlässigkeit und Innovation. Wir sind stolz darauf, unseren Kunden maßgeschneiderte Lösungen anzubieten, die genau auf ihre Bedürfnisse zugeschnitten sind.
              </p>
              
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Mit dem "Rundum-Sorglos-Paket" kümmern wir uns um alle Ihre Anliegen - von der Gebäudebetreuung über Grünflächenpflege bis hin zu Spezialdienstleistungen. Ihre Zufriedenheit ist unser Maßstab!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { number: "96", label: "Zufriedene Kunden" },
                { number: "156", label: "Abgeschlossene Projekte" },
                { number: "100%", label: "Leistungsversprechen" },
                { number: "24/7", label: "Bereitschaft" }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600 text-center"
                  style={{ 
                    transitionDelay: `${600 + index * 100}ms`,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease'
                  }}
                >
                  <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">{stat.number}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4">
              <a 
                href="#contact"
                className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md transition-all"
                style={{ 
                  transitionDelay: '1000ms',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease'
                }}
              >
                <Target className="mr-2 w-5 h-5" />
                <span>Kostenlose Beratung</span>
              </a>
              
              <a 
                href="tel:+4368184030694"
                className="inline-flex items-center px-6 py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg shadow-md transition-all"
                style={{ 
                  transitionDelay: '1100ms',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease'
                }}
              >
                <Users className="mr-2 w-5 h-5" />
                <span>Jetzt anrufen</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
