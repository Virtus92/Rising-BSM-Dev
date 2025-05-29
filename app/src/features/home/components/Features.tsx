'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Target, Shield, Users, Clock, Award, Lightbulb, Leaf } from 'lucide-react';
import { Handshake } from 'lucide-react';

/**
 * Features component for Rising BS e.U.
 * 
 * Displays the key features and values of the company
 * with modern design elements and animations.
 */
const Features = () => {
  const [activeTab, setActiveTab] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
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

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);

  const features = [
    {
      title: "Qualität & Innovation",
      description: "Wir setzen auf höchste Qualitätsstandards und innovative Lösungen für optimale Ergebnisse.",
      icon: <Award className="w-6 h-6" />,
      color: "from-orange-500 to-amber-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      points: [
        "Zertifizierte Mitarbeiter mit regelmäßigen Schulungen",
        "Moderne Ausrüstung und Technologien",
        "Kontinuierliche Verbesserung unserer Prozesse",
        "Qualitätskontrolle bei jedem Auftrag"
      ]
    },
    {
      title: "Kundenzufriedenheit",
      description: "Ihre Zufriedenheit ist unser Maßstab - wir gehen die Extrameile für unsere Kunden.",
      icon: <Handshake className="w-6 h-6" />,
      color: "from-blue-600 to-cyan-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      points: [
        "Individuelle Beratung und maßgeschneiderte Lösungen",
        "Transparente Kommunikation und faire Preise",
        "Schnelle Reaktionszeiten und Flexibilität",
        "Langfristige Kundenbeziehungen"
      ]
    },
    {
      title: "Rundum-Sorglos-Paket",
      description: "Alles aus einer Hand - wir kümmern uns um alle Ihre Anliegen.",
      icon: <Shield className="w-6 h-6" />,
      color: "from-green-600 to-emerald-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      points: [
        "Komplette Koordination aller Dienstleistungen",
        "Ein Ansprechpartner für alle Belange",
        "Regelmäßige Betreuung und Wartung",
        "Notfallservice bei dringenden Anliegen"
      ]
    },
    {
      title: "Nachhaltigkeit",
      description: "Umweltfreundliche Verfahren und nachhaltige Praktiken für eine bessere Zukunft.",
      icon: <Leaf className="w-6 h-6" />,
      color: "from-emerald-600 to-green-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
      points: [
        "Umweltschonende Reinigungsmittel und Verfahren",
        "Ressourcenschonende Arbeitsweise",
        "Nachhaltige Entsorgung und Recycling",
        "Beitrag zum Umweltschutz"
      ]
    }
  ];

  return (
    <section id="features" ref={featuresRef} className="py-20 bg-white dark:bg-slate-900">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div 
            className={`transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Was uns <span className="text-orange-600 dark:text-orange-400">auszeichnet</span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300">
              RISING BS e.U. steht für Qualität, Zuverlässigkeit und Innovation in allen Bereichen unserer Dienstleistungen.
            </p>
          </div>
        </div>

        {/* Feature tabs */}
        <div className="mb-12">
          <div 
            className={`flex flex-wrap justify-center gap-2 md:gap-4 transition-all duration-700 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center px-4 py-2 md:px-6 md:py-3 rounded-lg transition-all ${
                  activeTab === index
                    ? `bg-gradient-to-r ${feature.color} text-white shadow-lg`
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className={activeTab === index ? 'mr-2' : 'mr-2'}>
                  {feature.icon}
                </span>
                <span className="font-medium">{feature.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature details */}
        <div 
          className={`grid md:grid-cols-7 gap-8 items-center transition-all duration-700 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Feature visual */}
          <div className="md:col-span-3 order-2 md:order-1">
            <div className="relative">
              <div className={`absolute inset-0 rounded-2xl blur-2xl opacity-20 ${features[activeTab].bgColor}`}></div>
              <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${features[activeTab].color} p-12 shadow-xl border border-slate-200 dark:border-slate-700`}>
                <div className="flex items-center justify-center h-64">
                  <div className="text-white/20">
                    {React.cloneElement(features[activeTab].icon, { className: 'w-48 h-48' })}
                  </div>
                </div>
                <div className="absolute top-8 left-8 right-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                      {features[activeTab].icon}
                    </div>
                    <h3 className="text-white text-xl font-semibold">
                      {features[activeTab].title}
                    </h3>
                  </div>
                </div>
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-white/90 text-sm">
                      Ihre Zufriedenheit ist unser Maßstab
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature content */}
          <div className="md:col-span-4 order-1 md:order-2">
            <div className={`inline-flex items-center ${features[activeTab].bgColor} bg-opacity-50 dark:bg-opacity-20 px-4 py-2 rounded-full mb-4`}>
              {features[activeTab].icon}
              <span className="ml-2 font-semibold">{features[activeTab].title}</span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${features[activeTab].color}`}>
                {features[activeTab].title}
              </span>
            </h3>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              {features[activeTab].description}
            </p>
            
            <ul className="space-y-3">
              {features[activeTab].points.map((point, idx) => (
                <li key={idx} className="flex items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${features[activeTab].bgColor}`}>
                    <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Additional values grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Clock className="w-6 h-6" />,
              title: "24/7 Bereitschaft",
              description: "Rund um die Uhr für Sie da - besonders wichtig beim Winterdienst und Notfällen."
            },
            {
              icon: <Target className="w-6 h-6" />,
              title: "Maßgeschneiderte Lösungen",
              description: "Individuelle Konzepte, die genau auf Ihre Bedürfnisse zugeschnitten sind."
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: "Professionelles Team",
              description: "Qualifizierte Mitarbeiter mit langjähriger Erfahrung und regelmäßigen Schulungen."
            },
            {
              icon: <Lightbulb className="w-6 h-6" />,
              title: "Innovative Ansätze",
              description: "Moderne Technologien und Verfahren für effiziente und nachhaltige Ergebnisse."
            }
          ].map((item, index) => (
            <div 
              key={index}
              className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow border border-slate-100 dark:border-slate-700 transition-all duration-700 hover:shadow-lg transform hover:-translate-y-1 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${800 + index * 100}ms` }}
            >
              <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
