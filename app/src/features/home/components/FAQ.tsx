'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, PlusCircle, MinusCircle } from 'lucide-react';

/**
 * FAQ component for the landing page
 * 
 * Displays frequently asked questions in an accordion format
 * with modern design elements and animations.
 */
const FAQ = () => {
  const faqRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

    if (faqRef.current) {
      observer.observe(faqRef.current);
    }

    return () => {
      if (faqRef.current) {
        observer.unobserve(faqRef.current);
      }
    };
  }, []);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Welche Dienstleistungen bietet RISING BS an?",
      answer: "RISING BS bietet ein umfassendes Spektrum an Dienstleistungen: Winterdienst (Schneeräumung & Streuung), Grünflächenbetreuung (Rasenpflege, Baum- & Heckenschnitt), Reinigung (Dampfreinigung ohne Chemie), Hausbetreuung, Umzüge & Transporte sowie Kranführerdienstleistungen."
    },
    {
      question: "In welchen Gebieten ist RISING BS tätig?",
      answer: "Wir sind hauptsächlich in Linz und Umgebung tätig. Je nach Auftragslage und Projekt können wir aber auch in anderen Regionen Oberösterreichs unsere Dienstleistungen anbieten. Kontaktieren Sie uns für individuelle Anfragen!"
    },
    {
      question: "Wie funktioniert der Winterdienst?",
      answer: "Unser Winterdienst ist 24/7 einsatzbereit. Bei Schneefall oder Glatteis sind wir automatisch vor Ort, ohne dass Sie uns extra rufen müssen. Wir räumen Schnee, streuen Gehwege und Parkplätze und sorgen für sichere Wege. Alle Einsätze werden dokumentiert."
    },
    {
      question: "Was ist das Besondere an der Dampfreinigung?",
      answer: "Unsere Dampfreinigung arbeitet komplett ohne Chemikalien und entfernt 99,9% aller Bakterien. Das Verfahren ist besonders umweltfreundlich, allergikerfreundlich und ideal für Haushalte mit Kindern und Haustieren. Trotzdem erreichen wir eine gründliche Tiefenreinigung."
    },
    {
      question: "Bieten Sie auch Notfalldienste an?",
      answer: "Ja, wir bieten einen 24/7 Notfalldienst für dringende Situationen wie Sturmschäden, Wasserschäden oder andere unvorhergesehene Ereignisse. Sie erreichen uns jederzeit unter unserer Notfallnummer +43 681 840 30 694."
    },
    {
      question: "Wie erhalte ich ein Angebot?",
      answer: "Ein unverbindliches Angebot erhalten Sie ganz einfach: Kontaktieren Sie uns telefonisch, per E-Mail oder über unser Kontaktformular. Wir besprechen Ihre Anforderungen, besichtigen bei Bedarf das Objekt und erstellen Ihnen ein maßgeschneidertes Angebot - transparent und fair kalkuliert."
    }
  ];

  return (
    <section id="faq" ref={faqRef} className="py-20 bg-slate-50 dark:bg-slate-800/50">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto">
          <div 
            className={`text-center mb-12 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Häufig gestellte <span className="text-orange-600 dark:text-orange-400">Fragen</span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Hier finden Sie Antworten auf die wichtigsten Fragen zu unseren Dienstleistungen.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className={`bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 ${
                  openIndex === index ? 'shadow-md' : ''
                } ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <button
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                  onClick={() => toggleQuestion(index)}
                  aria-expanded={openIndex === index}
                >
                  <span className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                    {faq.question}
                  </span>
                  <span className={`text-orange-600 dark:text-orange-400 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}>
                    {openIndex === index ? 
                      <MinusCircle className="w-5 h-5" /> : 
                      <PlusCircle className="w-5 h-5" />
                    }
                  </span>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 text-slate-600 dark:text-slate-300">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div 
            className={`mt-12 text-center transition-all duration-700 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Haben Sie weitere Fragen? Wir sind gerne für Sie da!
            </p>
            <a 
              href="#contact"
              className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md transition-all"
            >
              <ChevronDown className="mr-2 w-5 h-5" />
              <span>Kontaktieren Sie uns</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
