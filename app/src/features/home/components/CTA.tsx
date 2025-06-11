'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Github, Code, ArrowRight } from 'lucide-react';

/**
 * CTA (Call-to-Action) component for the landing page
 * 
 * Provides compelling calls to action to encourage users to
 * try or contribute to the Rising BSM platform.
 */
const CTA = () => {
  const ctaRef = useRef<HTMLDivElement>(null);
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

    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }

    return () => {
      if (ctaRef.current) {
        observer.unobserve(ctaRef.current);
      }
    };
  }, []);

  return (
    <section ref={ctaRef} className="py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 -z-10" />
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: "url('/images/grid-pattern.svg')" }} />
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Business?
            </h2>
            
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Join the community of businesses leveraging open-source AI technology to revolutionize their operations. Rising BSM is free, powerful, and waiting for you.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/auth/register" 
                className="bg-white hover:bg-indigo-50 text-indigo-600 px-8 py-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 font-medium text-lg flex items-center justify-center"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              
              <a 
                href="https://github.com/Virtus92/Rising-BSM" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-indigo-700 hover:bg-indigo-800 text-white px-8 py-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 font-medium text-lg flex items-center justify-center"
              >
                <Github className="mr-2 w-5 h-5" />
                <span>Star on GitHub</span>
              </a>
            </div>
          </div>
          
          {/* Features highlight */}
          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            style={{ 
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              transitionDelay: '300ms'
            }}
          >
            {[
              {
                title: "Easy Deployment",
                description: "Get up and running in minutes with our straightforward deployment process."
              },
              {
                title: "Fully Customizable",
                description: "Adapt and extend Rising BSM to meet your specific business requirements."
              },
              {
                title: "Community Support",
                description: "Join our active community for help, ideas, and collaboration."
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                style={{ 
                  transitionDelay: `${400 + index * 100}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease'
                }}
              >
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-indigo-100">{feature.description}</p>
              </div>
            ))}
          </div>
          
          {/* Code snippet preview */}
          <div 
            className="mt-16 bg-slate-900 rounded-xl p-6 shadow-2xl overflow-hidden mx-auto max-w-3xl text-left"
            style={{ 
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              transitionDelay: '700ms'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="text-slate-400 text-sm">Install Command</div>
            </div>
            
            <div className="font-mono text-green-400 mb-4">
              <span className="text-slate-500">$</span> git clone https://github.com/Virtus92/Rising-BSM.git
            </div>
            
            <div className="font-mono text-green-400 mb-4">
              <span className="text-slate-500">$</span> cd Rising-BSM/app
            </div>
            
            <div className="font-mono text-green-400">
              <span className="text-slate-500">$</span> npm install && npm run dev
            </div>
            
            <div className="mt-6 border-t border-slate-700 pt-4 text-center">
              <span className="text-slate-400">Start building your AI-powered business management system today!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
