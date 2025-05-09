'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle, ShieldCheck, Check } from 'lucide-react';
import { ApiClient } from '@/core/api/ApiClient';

/**
 * RequestShowcase Component
 * 
 * A clean, functional component that allows users to submit real service requests
 * with proper form validation and API integration.
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
      id: 'consultation',
      name: 'Consultation',
      description: 'Expert advice on your business needs'
    },
    {
      id: 'implementation',
      name: 'Implementation',
      description: 'Professional setup and configuration'
    },
    {
      id: 'development',
      name: 'Custom Development',
      description: 'Tailored solutions for specific requirements'
    },
    {
      id: 'support',
      name: 'Technical Support',
      description: 'Ongoing assistance and troubleshooting'
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
        newErrors.service = 'Please select a service';
      }
    }
    
    if (currentStep === 2) {
      if (!name.trim()) {
        newErrors.name = 'Name is required';
      } else if (name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
      
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      if (!message.trim()) {
        newErrors.message = 'Please provide details about your request';
      } else if (message.length < 10) {
        newErrors.message = 'Message must be at least 10 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate final step
    if (!validateForm(3)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Initialize API client
      await ApiClient.initialize();
      
      // Create request payload
      const requestData = {
        name,
        email,
        phone: phone || undefined,
        service,
        message,
      };
      
      // Submit to API
      const response = await ApiClient.post('/api/requests/public', requestData);
      
      if (response.success) {
        setIsSubmitted(true);
        // Reset form after 5 seconds
        setTimeout(() => {
          resetForm();
        }, 5000);
      } else {
        setError(response.message || 'Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setError('An unexpected error occurred. Please try again later.');
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
      className="py-20 bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-200/30 dark:bg-blue-900/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-sm font-medium mb-4">
            Get Started Today
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Request a <span className="text-blue-600 dark:text-blue-400">Consultation</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Tell us about your project and we'll get back to you within 24 hours with a personalized plan.
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
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
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
                        ? 'bg-blue-600 text-white scale-110 shadow-md shadow-blue-500/20' 
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
                      ? 'text-blue-600 dark:text-blue-400' 
                      : step > stepNum 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-slate-400'
                  }`}>
                    {stepNum === 1 ? 'Service' : stepNum === 2 ? 'Details' : 'Review'}
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
                      What service are you interested in?
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      {services.map((serviceOption) => (
                        <div 
                          key={serviceOption.id}
                          onClick={() => setService(serviceOption.name)}
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                            service === serviceOption.name
                              ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
                              {serviceOption.name}
                            </h4>
                            {service === serviceOption.name && (
                              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full">
                                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-slate-300 dark:bg-slate-700 opacity-70 cursor-not-allowed'
                        }`}
                        disabled={!service}
                      >
                        Continue <ArrowRight className="ml-2 h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Details */}
                {step === 2 && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                      Tell us about yourself
                    </h3>
                    
                    <div className="space-y-5 mb-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`w-full px-4 py-3 border ${
                            errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                          } rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:focus:ring-blue-500/30 transition-colors`}
                          placeholder="Your name"
                        />
                        {errors.name && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full px-4 py-3 border ${
                            errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                          } rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:focus:ring-blue-500/30 transition-colors`}
                          placeholder="your@email.com"
                        />
                        {errors.email && (
                          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Phone Number <span className="text-slate-400 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:focus:ring-blue-500/30 transition-colors"
                          placeholder="+43 123 456789"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Your Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          className={`w-full px-4 py-3 border ${
                            errors.message ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                          } rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:focus:ring-blue-500/30 transition-colors`}
                          placeholder="Please provide details about your request..."
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
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="inline-flex items-center px-5 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
                      >
                        Continue <ArrowRight className="ml-2 h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && !isSubmitted && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                      Review and Submit
                    </h3>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
                      <div className="space-y-5">
                        <div className="flex items-center">
                          <div className="w-36 flex-shrink-0">
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Service</span>
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
                              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Email</span>
                            </div>
                            <div className="flex-1">
                              <span className="text-slate-900 dark:text-white font-medium">{email}</span>
                            </div>
                          </div>
                          
                          {phone && (
                            <div className="flex items-center">
                              <div className="w-36 flex-shrink-0">
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Phone</span>
                              </div>
                              <div className="flex-1">
                                <span className="text-slate-900 dark:text-white font-medium">{phone}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block mb-2">Message</span>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm">{message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                      <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Your information is secure and will only be used to process your request. We'll respond within 24 hours.
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-5 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-700/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Request'
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
                      Request Submitted Successfully!
                    </h3>
                    
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                      Thank you for your request. A member of our team will review it and get back to you
                      within 24 hours at <span className="font-semibold text-slate-900 dark:text-white">{email}</span>.
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
                title: "Fast Response Time", 
                description: "We respond to all inquiries within 24 hours, ensuring you receive prompt attention to your needs.",
                icon: "⚡"
              },
              { 
                title: "Expert Consultation", 
                description: "Get personalized advice from our team of specialists with years of industry experience.",
                icon: "🧠"
              },
              { 
                title: "Tailored Solutions", 
                description: "Every solution we provide is custom-built to address your specific business requirements.",
                icon: "🔧"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300"
              >
                <div className="text-2xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RequestShowcase;