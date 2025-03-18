'use client';

import { useState, FormEvent } from 'react';
import { 
  MapPin, Phone, Mail, Clock, 
  CheckCircle, AlertTriangle, Send, Bot 
} from 'lucide-react';

type FormData = {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  privacy: boolean;
};

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
    privacy: false
  });
  
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.service || !formData.message || !formData.privacy) {
      setFormStatus('error');
      setErrorMessage('Bitte füllen Sie alle erforderlichen Felder aus.');
      return;
    }
    
    setFormStatus('submitting');
    
    try {
      // Send form data directly to the backend
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ein Fehler ist aufgetreten.');
      }
      
      const result = await response.json();
      
      setFormStatus('success');
      
      // Reset form after success
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: '',
        privacy: false
      });
      
    } catch (error) {
      setFormStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      console.error('Error submitting form:', error);
    }
  };
  
  const startAIBeratung = () => {
    console.log('AI Beratung started');
    // In a real app, you would open a chat widget or dialog here
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
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-6">Nachricht senden</h3>
              
              {formStatus === 'success' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-500 mb-2">Vielen Dank für Ihre Nachricht!</h4>
                  <p className="text-green-700 dark:text-green-400">
                    Wir haben Ihre Anfrage erhalten und werden uns in Kürze bei Ihnen melden.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        E-Mail *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="service" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gewünschte Leistung *
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="">Bitte auswählen</option>
                        <option value="facility">Facility Management</option>
                        <option value="moving">Umzüge & Transporte</option>
                        <option value="winter">Sommer- & Winterdienst</option>
                        <option value="other">Sonstiges</option>
                      </select>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ihre Nachricht *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      ></textarea>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="privacy"
                          name="privacy"
                          checked={formData.privacy}
                          onChange={handleCheckboxChange}
                          className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          required
                        />
                        <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Ich stimme zu, dass meine Daten für die Bearbeitung meiner Anfrage verwendet werden. *
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {formStatus === 'error' && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mr-2 mt-0.5" />
                        <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-md transition flex items-center justify-center"
                    >
                      {formStatus === 'submitting' ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Nachricht senden
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;