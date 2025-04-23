'use client';

import { useState } from 'react';
import { Check, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';

/**
 * Typdefinition für die Daten eines Service-Modals
 */
type ServiceModalData = {
  title: string;
  subtitle: string;
  image: string;
  content: React.ReactNode;
};

/**
 * Services-Komponente für die Landingpage
 * 
 * Zeigt die angebotenen Dienstleistungen als Karten mit modalen Detailansichten.
 */
const Services = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<ServiceModalData | null>(null);

  const openModal = (service: ServiceModalData) => {
    setCurrentService(service);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  /**
   * Service-Modal Daten
   */
  const serviceModals: Record<string, ServiceModalData> = {
    facility: {
      title: 'Facility Management',
      subtitle: 'Professionelle Betreuung für Ihre Immobilien',
      image: '/images/Cleaning.jpg',
      content: (
        <div className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            Unser Facility Management umfasst alle Dienstleistungen rund um Ihre Immobilie. Wir kümmern uns um die Werterhaltung und funktionale Optimierung Ihrer Gebäude.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-3">Hausbetreuung</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Schneeräumung</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Streuservice</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Eisbeseitigung</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-3">Baumpflege</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Baumschnitt</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Baumkontrolle</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Sturmschadenbeseitigung</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-3">Vertragsdienste</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>24/7 Bereitschaftsdienst</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Wetterwarnservice</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Dokumentation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    moving: {
      title: 'Umzüge & Transporte',
      subtitle: 'Professionelle Transportlösungen',
      image: '/images/transport.jpg',
      content: (
        <div className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            Unsere Transport- und Umzugsdienstleistungen bieten Ihnen zuverlässige und effiziente Lösungen für jede Transportaufgabe.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-3">Umzugsservice</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Privatumzüge</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Firmenumzüge</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Ein- und Auspackservice</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-3">Spezielle Transporte</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Möbeltransporte</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Klaviertransporte</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Kunsttransporte</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    winter: {
      title: 'Sommer- & Winterdienst',
      subtitle: 'Ganzjährige Betreuung Ihrer Außenanlagen',
      image: '/images/Path.webp',
      content: (
        <div className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            Unser Sommer- und Winterdienst sorgt für die optimale Pflege und Sicherheit Ihrer Außenanlagen zu jeder Jahreszeit.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-3">Winterdienst</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Schneeräumung</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Streuservice</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Eisbeseitigung</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-3">Sommerdienst</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Rasenpflege</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Hecken- und Strauchschnitt</span>
                </li>
                <li className="flex items-start">
                  <Check size={20} className="text-green-600 mr-2 mt-0.5" />
                  <span>Unkrautbeseitigung</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <section id="services" className="bg-gray-50 dark:bg-slate-800 section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Unsere Leistungen</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Ganzheitliche Lösungen – effizient, zuverlässig und individuell
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Service Card 1: Facility Management */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden card-hover">
            <div className="relative h-56">
              <Image 
                src="/images/Cleaning.jpg"
                alt="Facility Management"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-3">Facility Management</h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <Check size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Komplette Hausbetreuung</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Pflege von Grünflächen & Außenanlagen</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Reinigungs- und Instandhaltungsservice</span>
                </li>
              </ul>
              <button 
                onClick={() => openModal(serviceModals.facility)}
                className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium inline-flex items-center"
              >
                Mehr erfahren <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
          </div>

          {/* Service Card 2: Umzüge & Transporte */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden card-hover">
            <div className="relative h-56">
              <Image 
                src="/images/transport.jpg"
                alt="Umzüge & Transporte"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-3">Umzüge & Transporte</h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <Check size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Privat- & Firmenumzüge</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Möbel- & Spezialtransporte</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Express- & Langstreckenlieferungen</span>
                </li>
              </ul>
              <button 
                onClick={() => openModal(serviceModals.moving)}
                className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium inline-flex items-center"
              >
                Mehr erfahren <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
          </div>

          {/* Service Card 3: Sommer- & Winterdienst */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden card-hover md:col-span-2 lg:col-span-1">
            <div className="relative h-56">
              <Image 
                src="/images/Path.webp"
                alt="Sommer- & Winterdienst"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-3">Sommer- & Winterdienst</h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <Check size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Rasenpflege & Baumschnitt</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Schnee- & Eisräumung</span>
                </li>
                <li className="flex items-start">
                  <Check size={18} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Streudienst & Präventivmaßnahmen</span>
                </li>
              </ul>
              <button 
                onClick={() => openModal(serviceModals.winter)}
                className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium inline-flex items-center"
              >
                Mehr erfahren <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Service Modal */}
      {modalOpen && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div 
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full z-10 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative h-48 w-full">
              <Image
                src={currentService.image}
                alt={currentService.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black opacity-60"></div>
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="text-2xl font-bold text-white">{currentService.title}</h3>
                <p className="text-white/80">{currentService.subtitle}</p>
              </div>
              <button 
                className="absolute top-4 right-4 text-white hover:text-gray-200 p-1 rounded-full bg-black/30"
                onClick={closeModal}
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              {currentService.content}
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between">
              <button 
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={closeModal}
              >
                Schließen
              </button>
              <a 
                href="#contact" 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
                onClick={closeModal}
              >
                Anfrage senden
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;