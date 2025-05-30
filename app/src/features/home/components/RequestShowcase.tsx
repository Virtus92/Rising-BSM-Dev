'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle, ShieldCheck, Check, Phone, AlertTriangle } from 'lucide-react';

/**
 * RequestShowcase Component für RISING BS e.U.
 * 
 * Kontaktformular für Serviceanfragen mit mehreren Schritten
 */
const RequestShowcase = () => {
  // Form steps
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Available services
  const services = [
    {
      id: 'winterdienst',
      name: 'Winterdienst',
      description: 'Schneeräumung und Streuservice für sichere Wege'
    },
    {
      id: 'gruenflaeche',
      name: 'Grünflächenpflege',
      description: 'Rasenpflege, Baum- und Heckenschnitt'
    },
    {
      id: 'reinigung',
      name: 'Reinigung',
      description: 'Dampfreinigung ohne Chemikalien'
    },
    {
      id: 'umzuege',
      name: 'Umzüge & Transporte',
      description: 'Komplettservice für Privat- und Firmenumzüge'
    },
    {
      id: 'kranfuehrer',
      name: 'Kranführer',
      description: 'Zertifizierte Kranführer für Bauprojekte'
    },
    {
      id: 'hausbetreuung',
      name: 'Hausbetreuung',
      description: 'Umfassende Betreuung und Wartung'
    }
  ];

  // Set up scroll detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    const element = document.getElementById('request-section');
    if (element) {
      observer.observe(element);
      return () => {
        observer.unobserve(element);
      };
    }
  }, []);

  // Validate form fields
  const validateForm = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!service) {
        newErrors.service = 'Bitte wählen Sie eine Dienstleistung aus';
      }
    }
    
    if (currentStep === 2) {
      if (!name.trim()) {
        newErrors.name = 'Name ist erforderlich';
      } else if (name.length < 2) {
        newErrors.name = 'Name muss mindestens 2 Zeichen lang sein';
      }
      
      if (!email.trim()) {
        newErrors.email = 'E-Mail ist erforderlich';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      }
      
      if (!message.trim()) {
        newErrors.message = 'Bitte beschreiben Sie Ihr Anliegen';
      } else if (message.length < 10) {
        newErrors.message = 'Nachricht muss mindestens 10 Zeichen lang sein';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - actually send to API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate final step
    if (!validateForm(3)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Initialize the API client
      await import('@/core/api/ApiClient').then(async ({ default: ApiClient }) => {
        await ApiClient.initialize();
        
        // Prepare request data
        const requestData = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          service: service,
          message: message.trim(),
        };
        
        // Send to API
        await ApiClient.post('/requests/public', requestData);
        
        // Success
        setIsSubmitted(true);
        
        // Reset form after 8 seconds
        setTimeout(() => {
          resetForm();
        }, 8000);
      });
    } catch (error) {
      console.error('Failed to submit request:', error);
      setError(
        'Es ist ein Fehler beim Senden Ihrer Anfrage aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setStep(1);
    setName('');
    setEmail('');
    setPhone('');
    setService('');
    setMessage('');
    setIsSubmitted(false);
    setErrors({});
    setError(null);
  };

  // Move to next step if validation passes
  const nextStep = () => {
    if (validateForm(step)) {
      setStep(step + 1);
    }
  };

  // Move to previous step
  const prevStep = () => {
    setStep(step - 1);
    // Clear errors when going back
    setErrors({});
  };

  return (
    <section
      id="request-section"
      className="py-20 bg-gradient-to-b from-slate-50 to-orange-50 dark:from-slate-900 dark:to-orange-950 relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-200/30 dark:bg-orange-900/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-200/30 dark:bg-blue-900/20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-sm font-medium mb-4">
            Kostenlose Beratung
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Anfrage <span className="text-orange-600 dark:text-orange-400">stellen</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Erzählen Sie uns von Ihrem Projekt und wir melden uns innerhalb von 24 Stunden mit einem individuellen Angebot.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700">
              <div 
                className="h-full bg-orange-600 dark:bg-orange-500 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>

            {/* Steps indicator */}
            <div className="flex justify-between px-6 md:px-8 py-4 border-b border-slate-200 dark:border-slate-700">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-300 ${
                      step === stepNum 
                        ? 'bg-orange-600 text-white scale-110 shadow-md shadow-orange-500/20' 
                        : step > stepNum 
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {step > stepNum ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${
                    step === stepNum 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : step > stepNum 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-slate-400'
                  }`}>
                    {stepNum === 1 ? 'Service' : stepNum === 2 ? 'Angaben' : 'Prüfung'}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 md:p-8">
                {/* Step 1: Service Selection */}
                {step === 1 && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                      Welche Dienstleistung benötigen Sie?
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {services.map((serviceOption) => (
                        <div 
                          key={serviceOption.id}
                          onClick={() => setService(serviceOption.name)}
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                            service === serviceOption.name
                              ? 'border-orange-600 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-700 hover:shadow'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
                              {serviceOption.name}
                            </h4>
                            {service === serviceOption.name && (
                              <span className="flex items-center justify-center w-6 h-6 bg-orange-100 dark:bg-orange-800 rounded-full">
                                <Check className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-sm">
                            {serviceOption.description}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {errors.service && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800">
                        {errors.service}
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={nextStep}
                        className={`inline-flex items-center px-5 py-2.5 rounded-lg font-medium text-white transition-all duration-300 ${
                          service 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : 'bg-slate-300 dark:bg-slate-700 opacity-70 cursor-not-allowed'
                        }`}
                        disabled={!service}
                      >
                        Weiter <ArrowRight className="ml-2 h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Details */}
                {step === 2 && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                      Ihre Kontaktdaten
                    </h3>
                    
                    <div className="space-y-5 mb-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Vollständiger Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`w-full px-4 py-3 border ${
                            errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                          } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:bg-slate-800 dark:focus:ring-orange-500/30 transition-colors`}
                          placeholder="Ihr Name"
                        />
                        {errors.name && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          E-Mail-Adresse <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full px-4 py-3 border ${
                            errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                          } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:bg-slate-800 dark:focus:ring-orange-500/30 transition-colors`}
                          placeholder="ihre@email.at"
                        />
                        {errors.email && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Telefonnummer <span className="text-slate-400 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:bg-slate-800 dark:focus:ring-orange-500/30 transition-colors"
                          placeholder="+43 123 456789"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Ihre Nachricht <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          className={`w-full px-4 py-3 border ${
                            errors.message ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                          } rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:bg-slate-800 dark:focus:ring-orange-500/30 transition-colors`}
                          placeholder="Bitte beschreiben Sie Ihr Anliegen..."
                        ></textarea>
                        {errors.message && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-5 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300"
                      >
                        Zurück
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="inline-flex items-center px-5 py-2.5 rounded-lg font-medium bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300"
                      >
                        Weiter <ArrowRight className="ml-2 h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && !isSubmitted && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                      Anfrage überprüfen und absenden
                    </h3>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
                      <div className="space-y-5">
                        <div className="flex items-center">
                          <div className="w-36 flex-shrink-0">
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Dienstleistung</span>
                          </div>
                          <div className="flex-1">
                            <span className="text-slate-900 dark:text-white font-medium">{service}</span>
                          </div>
                        </div>
                        
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                          <div className="flex items-center mb-3">
                            <div className="w-36 flex-shrink-0">
                              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Name</span>
                            </div>
                            <div className="flex-1">
                              <span className="text-slate-900 dark:text-white font-medium">{name}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center mb-3">
                            <div className="w-36 flex-shrink-0">
                              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">E-Mail</span>
                            </div>
                            <div className="flex-1">
                              <span className="text-slate-900 dark:text-white font-medium">{email}</span>
                            </div>
                          </div>
                          
                          {phone && (
                            <div className="flex items-center">
                              <div className="w-36 flex-shrink-0">
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Telefon</span>
                              </div>
                              <div className="flex-1">
                                <span className="text-slate-900 dark:text-white font-medium">{phone}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-2">Nachricht</span>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm">{message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center mb-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-100 dark:border-orange-800">
                      <ShieldCheck className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-3 flex-shrink-0" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Ihre Daten werden sicher behandelt und nur zur Bearbeitung Ihrer Anfrage verwendet. Wir antworten innerhalb von 24 Stunden.
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-5 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300"
                      >
                        Zurück
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-6 py-3 rounded-lg font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 dark:shadow-orange-700/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Wird gesendet...
                          </>
                        ) : (
                          'Anfrage senden'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {isSubmitted && (
                  <div className="py-12 text-center">
                    <div className="mx-auto w-20 h-20 mb-8 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 shadow-md shadow-green-200 dark:shadow-green-900/20">
                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                      Anfrage erfolgreich gesendet!
                    </h3>
                    
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                      Vielen Dank für Ihre Anfrage. Unser Team wird sie prüfen und sich innerhalb von 24 Stunden bei Ihnen unter <span className="font-semibold text-slate-900 dark:text-white">{email}</span> melden.
                    </p>
                    
                    <div className="relative max-w-xs mx-auto h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 4 }}
                        className="absolute inset-0 bg-green-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Features list */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Schnelle Antwort", 
                description: "Wir antworten auf alle Anfragen innerhalb von 24 Stunden und sorgen für prompte Bearbeitung.",
                icon: "⚡"
              },
              { 
                title: "Kostenlose Beratung", 
                description: "Erhalten Sie unverbindliche Beratung von unserem erfahrenen Team ohne versteckte Kosten.",
                icon: "💬"
              },
              { 
                title: "Maßgeschneiderte Lösungen", 
                description: "Jede Lösung wird individuell auf Ihre spezifischen Anforderungen zugeschnitten.",
                icon: "🔧"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-300"
              >
                <div className="text-2xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Direct Contact Option */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-orange-600 to-blue-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Oder rufen Sie uns direkt an</h3>
              <p className="text-orange-100 mb-6">
                Für dringende Anfragen sind wir auch telefonisch erreichbar
              </p>
              <a 
                href="tel:+4368184030694"
                className="inline-flex items-center bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors duration-300"
              >
                <Phone className="mr-2 h-5 w-5" />
                +43 681 840 30 694
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RequestShowcase;