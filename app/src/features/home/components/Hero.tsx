'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Users, Calendar, MessageSquare, Github } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

/**
 * Modern Hero component for the Landing page
 * 
 * Features a dynamic animation sequence, modern design elements,
 * and clear call-to-action sections.
 */
const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative pt-28 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 -z-10" />
      
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:space-x-12">
          {/* Left column: Text content */}
          <div 
            className={`lg:w-1/2 lg:pr-8 mb-12 lg:mb-0 transition-all duration-1000 ease-out transform ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-block mb-4 px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium">
              Open Source Project
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-400">
              AI-Powered Business Management
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-xl">
              Rising BSM lays the foundation for efficient development of personal AI assistants that handle requests, customers, and appointment management.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-10">
              {[
                { icon: <Users className="w-5 h-5 mr-2" />, text: "Customer Management" },
                { icon: <Calendar className="w-5 h-5 mr-2" />, text: "Appointment Scheduling" },
                { icon: <MessageSquare className="w-5 h-5 mr-2" />, text: "AI-Powered Assistants" }
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm text-slate-700 dark:text-slate-200"
                  style={{ 
                    transitionDelay: `${(index + 1) * 150}ms`,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease'
                  }}
                >
                  {feature.icon}
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
            
            <div 
              className="flex flex-wrap gap-4" 
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
                transitionDelay: '600ms'
              }}
            >
              <Link 
                href="#features" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md transition flex items-center justify-center space-x-2 text-lg"
              >
                <span>Explore Features</span>
                <ArrowRight size={20} />
              </Link>
              
              <a 
                href="https://github.com/Virtus92/Rising-BSM" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-6 py-3 rounded-lg shadow-md transition flex items-center justify-center space-x-2 text-lg"
              >
                <Github size={20} />
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
          
          {/* Right column: Image/Illustration */}
          <div 
            className={`lg:w-1/2 transition-all duration-1000 ease-out delay-300 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-300 dark:bg-yellow-500/20 rounded-lg blur-2xl opacity-30 animate-pulse"></div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-indigo-300 dark:bg-indigo-500/20 rounded-lg blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="relative pt-3 px-3 pb-0 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <div className="flex gap-1.5 absolute left-3 top-3">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="h-4"></div>
                </div>
                <Image
                  src="/images/screenshots/dashboard/Mainpage.png"
                  alt="Rising BSM Dashboard Preview"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
              </div>
              
              {/* Floating elements */}
              <div 
                className="absolute -right-4 top-1/4 bg-white dark:bg-slate-700 shadow-lg rounded-lg p-4 animate-float"
                style={{ 
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                  transitionDelay: '900ms',
                  animation: 'float 6s ease-in-out infinite'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">AI Assistant</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Processing request...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats section */}
        <div 
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          style={{ 
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            transitionDelay: '1000ms'
          }}
        >
          {[
            { label: "Open Source", value: "100%" },
            { label: "Free Forever", value: "✓" },
            { label: "Built with Next.js", value: "15.x" }
          ].map((stat, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-100 dark:border-slate-700 text-center hover:shadow-lg transition-shadow">
              <div className="text-3xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">{stat.value}</div>
              <div className="text-slate-600 dark:text-slate-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;
