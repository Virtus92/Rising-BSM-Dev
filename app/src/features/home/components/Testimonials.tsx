'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Quote } from 'lucide-react';

/**
 * Testimonials component for the landing page
 * 
 * Showcases user testimonials about Rising BSM with
 * modern design elements and animations.
 */
const Testimonials = () => {
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

    if (testimonialsRef.current) {
      observer.observe(testimonialsRef.current);
    }

    return () => {
      if (testimonialsRef.current) {
        observer.unobserve(testimonialsRef.current);
      }
    };
  }, []);

  // Auto rotate testimonials
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  const testimonials = [
    {
      quote: "Rising BSM has transformed how we handle customer requests. The AI assistant saves us hours every day by handling routine inquiries automatically.",
      author: "Sarah Johnson",
      position: "Operations Manager",
      avatar: "/images/testimonial-1.jpg",
      company: "TechSolutions Inc.",
      logo: "/images/company-logo-1.svg"
    },
    {
      quote: "As a freelancer, I needed an affordable system to manage client appointments. Rising BSM is not only free, but it's also more powerful than paid alternatives I've tried.",
      author: "Miguel Rodriguez",
      position: "Independent Consultant",
      avatar: "/images/testimonial-2.jpg",
      company: "Rodriguez Consulting",
      logo: "/images/company-logo-2.svg"
    },
    {
      quote: "The open-source nature of Rising BSM allowed us to customize it to our specific needs. We've integrated it with our existing systems seamlessly.",
      author: "Alex Chen",
      position: "CTO",
      avatar: "/images/testimonial-3.jpg",
      company: "Innovate Labs",
      logo: "/images/company-logo-3.svg"
    }
  ];

  return (
    <section ref={testimonialsRef} className="py-20 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div 
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What People Are <span className="text-indigo-600 dark:text-indigo-400">Saying</span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Hear from others who are already using Rising BSM to transform their business operations.
            </p>
          </div>
        </div>

        {/* Testimonial display */}
        <div className="relative">
          <div 
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 dark:bg-indigo-900/30 rounded-full blur-3xl opacity-20"
            style={{
              opacity: isVisible ? 0.2 : 0,
              transition: 'opacity 1.5s ease-in-out',
            }}
          ></div>
          
          <div 
            className={`relative transition-all duration-1000 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 mx-auto max-w-4xl transition-all duration-700 ease-in-out ${
                  activeIndex === index 
                    ? 'opacity-100 translate-y-0 z-10' 
                    : 'opacity-0 translate-y-8 absolute top-0 left-0 right-0 pointer-events-none'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="md:w-1/4 flex-shrink-0">
                    <div className="relative mb-4 group">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        width={100}
                        height={100}
                        className="rounded-full border-4 border-white dark:border-slate-700 shadow object-cover group-hover:scale-105 transition-transform w-24 h-24"
                      />
                    </div>
                    
                    <h4 className="font-bold text-xl mb-1">{testimonial.author}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">{testimonial.position}</p>
                    <div className="flex items-center">
                      <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">{testimonial.company}</span>
                      <Image
                        src={testimonial.logo}
                        alt={testimonial.company}
                        width={60}
                        height={24}
                        className="h-6 w-auto object-contain opacity-80 dark:opacity-60"
                      />
                    </div>
                  </div>
                  
                  <div className="md:w-3/4">
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl relative">
                      <Quote className="absolute top-4 left-4 w-6 h-6 text-indigo-400 opacity-20" />
                      <p className="text-lg md:text-xl text-slate-700 dark:text-slate-200 italic pl-6">
                        "{testimonial.quote}"
                      </p>
                    </div>
                    
                    <div className="mt-6 flex justify-center md:justify-start">
                      <div className="flex space-x-2">
                        {testimonials.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              idx === activeIndex
                                ? 'bg-indigo-600 dark:bg-indigo-400 w-8'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                            aria-label={`View testimonial ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
