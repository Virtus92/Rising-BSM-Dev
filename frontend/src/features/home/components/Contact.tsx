'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Bot } from 'lucide-react';
import { ContactForm } from './ContactForm';

/**
 * Contact-Komponente für die Landingpage
 * 
 * Zeigt ein Kontaktformular, Kontaktdaten und eine AI-Beratungsoption.
 */
const Contact = () => {
  const startAIBeratung = () => {
    window.open('https://chat.openai.com/g/g-0Fg9RjkI1-rising-bsm-support', '_blank');
  };

  return (
    <section id="contact" className="bg-gray-50 dark:bg-slate-800 section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Kontaktieren Sie uns</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Für Ihre individuelle Lösung sind wir nur einen Klick entfernt
          </p>
        </div>
        
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 h-full">
              <h3 className="text-xl font-bold mb-6">So erreichen Sie uns</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="mr-4 bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Adresse</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Waldmüllergang 10a, 4020 Linz</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Telefon</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      <a href="tel:+4368184030694" className="hover:text-green-600 dark:hover:text-green-500">
                        +43 681 840 30 694
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">E-Mail</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      <a href="mailto:info@rising-bsm.at" className="hover:text-green-600 dark:hover:text-green-500">
                        info@rising-bsm.at
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Geschäftszeiten</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Mo-Fr: 8:00 - 17:00 Uhr</p>
                  </div>
                </div>
              </div>
              
              {/* AI Beratung */}
              <div className="mt-10">
                <div className="bg-green-600 text-white p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-3">Schnelle Beratung gewünscht?</h3>
                  <p className="mb-4">Nutzen Sie unsere AI-Beratung für sofortige Antworten auf Ihre Fragen.</p>
                  <button 
                    className="bg-white text-green-600 px-4 py-2 rounded-md transition hover:bg-gray-100 flex items-center justify-center"
                    onClick={startAIBeratung}
                  >
                    <Bot className="mr-2 h-5 w-5" />
                    AI-Beratung starten
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;