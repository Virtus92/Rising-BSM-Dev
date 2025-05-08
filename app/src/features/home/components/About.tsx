'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Code, Heart, Zap } from 'lucide-react';

/**
 * About component for the Landing page
 * 
 * Explains the purpose and philosophy behind the Rising BSM project
 * with modern design elements and animations.
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
                  <h3 className="text-xl font-bold">Our Values</h3>
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium px-3 py-1 rounded-full">
                    Open Source
                  </div>
                </div>
                
                <div className="space-y-6">
                  {[
                    {
                      icon: <Code className="w-5 h-5" />,
                      title: "Open Source Philosophy",
                      description: "We believe fundamental software should be free and accessible to everyone. Our code is open for transparency, collaboration, and innovation."
                    },
                    {
                      icon: <Heart className="w-5 h-5" />,
                      title: "Built With Passion",
                      description: "Rising BSM is crafted with attention to detail and a commitment to quality that shows in every feature."
                    },
                    {
                      icon: <Zap className="w-5 h-5" />,
                      title: "Efficiency First",
                      description: "Our platform is designed for maximum efficiency, so you can focus on what matters: growing your business."
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
                      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-lg text-white mr-4 flex-shrink-0">
                        {value.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">{value.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400">{value.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 flex justify-center">
                  <Image
                    src="/images/Logo_vu.png"
                    alt="Open Source"
                    width={120}
                    height={40}
                    className="opacity-70 dark:opacity-40"
                  />
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
                Why We Built <span className="text-indigo-600 dark:text-indigo-400">Rising BSM</span>
              </h2>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                Rising BSM was created with a clear mission: to provide a free, open-source foundation for efficient development of personal AI assistants that handle business operations, customer management, and appointment scheduling.
              </p>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                We believe that powerful business management software should be accessible to everyone, not just large corporations with big budgets. By making Rising BSM open source, we're democratizing access to cutting-edge AI-powered tools.
              </p>
              
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Our platform is built on modern technologies like Next.js and Prisma, following best practices to create a scalable, maintainable, and extensible system that grows with your business.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { number: "100%", label: "Open Source" },
                { number: "10+", label: "Integrated Features" },
                { number: "24/7", label: "AI Availability" },
                { number: "0€", label: "Cost to Use" }
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
                  <div className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">{stat.number}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <a 
              href="https://github.com/Virtus92/Rising-BSM-release"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg shadow-md transition-all"
              style={{ 
                transitionDelay: '1000ms',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease'
              }}
            >
              <Code className="mr-2 w-5 h-5" />
              <span>View Source Code</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
