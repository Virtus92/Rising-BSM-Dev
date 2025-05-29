'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, Instagram, Youtube } from 'lucide-react';
import { ContactForm } from './ContactForm';

/**
 * Contact-Komponente für die Landingpage
 * 
 * Zeigt ein Kontaktformular, Kontaktdaten und Social Media Links.
 */
const Contact = () => {

  return (
    <section id="contact" className="bg-gray-50 dark:bg-slate-800 section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Kontakt</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Wir sind für Sie da - kontaktieren Sie uns für ein unverbindliches Angebot
          </p>
        </div>
        
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 h-full">
              <h3 className="text-xl font-bold mb-6">So erreichen Sie uns</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="mr-4 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Adresse</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Waldmüllergang 10a<br />4020 Linz, Österreich</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Telefon</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      <a href="tel:+4368184030694" className="hover:text-orange-600 dark:hover:text-orange-500">
                        +43 681 840 30 694
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">E-Mail</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      <a href="mailto:info.risingbs@gmail.com" className="hover:text-orange-600 dark:hover:text-orange-500">
                        info.risingbs@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Geschäftszeiten</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Montag - Freitag: 09:00 - 18:00 Uhr<br />
                      Samstag & Sonntag: Nach Vereinbarung
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Social Media */}
              <div className="mt-10">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-3">Folgen Sie uns</h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">Bleiben Sie auf dem Laufenden über unsere neuesten Projekte und Angebote.</p>
                  <div className="flex space-x-4">
                    <a 
                      href="https://www.instagram.com/bsrising" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-orange-600 text-white p-3 rounded-full hover:bg-orange-700 transition"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                    <a 
                      href="https://wa.me/4368184030694" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 transition"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                    <a 
                      href="https://www.youtube.com/@risingbs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition"
                    >
                      <Youtube className="h-5 w-5" />
                    </a>
                  </div>
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