'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Users, Calendar, MessageSquare, BarChart3, Settings, Bell, Search, Shield } from 'lucide-react';

/**
 * Features component for the Landing page
 * 
 * Displays the main features of the Rising BSM platform with
 * modern design elements and animations.
 */
const Features = () => {
  const [activeTab, setActiveTab] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
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

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);

  const features = [
    {
      title: "AI-Powered Assistants",
      description: "Leverage cutting-edge AI technology to handle customer queries, automate responses, and provide personalized experiences.",
      icon: <MessageSquare className="w-6 h-6" />,
      image: "/images/ai-assistant.jpg",
      color: "from-blue-600 to-indigo-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      points: [
        "Natural language processing for human-like interactions",
        "Context-aware responses based on customer history",
        "Seamless handoff to human agents when needed",
        "Multi-channel support (web, email, SMS)"
      ]
    },
    {
      title: "Customer Management",
      description: "Efficiently manage customer relationships with comprehensive profiles, interaction history, and segmentation capabilities.",
      icon: <Users className="w-6 h-6" />,
      image: "/images/customer-management.jpg",
      color: "from-green-600 to-emerald-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      points: [
        "Unified customer profiles with complete history",
        "Customer segmentation and tagging",
        "Customizable fields and attributes",
        "GDPR-compliant data management"
      ]
    },
    {
      title: "Appointment Scheduling",
      description: "Streamline your booking process with a flexible, automated scheduling system that integrates with your calendar.",
      icon: <Calendar className="w-6 h-6" />,
      image: "/images/appointment-scheduling.jpg",
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
      points: [
        "Intelligent time-slot recommendations",
        "Automated reminders and notifications",
        "Calendar integrations (Google, Outlook, iCal)",
        "Self-service booking options"
      ]
    },
    {
      title: "Analytics & Insights",
      description: "Gain valuable insights from your data with powerful analytics tools that help you make informed business decisions.",
      icon: <BarChart3 className="w-6 h-6" />,
      image: "/images/analytics-dashboard.jpg",
      color: "from-purple-600 to-violet-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      points: [
        "Real-time performance dashboards",
        "Custom reports and visualizations",
        "Trend analysis and forecasting",
        "Conversion and retention metrics"
      ]
    }
  ];

  return (
    <section id="features" ref={featuresRef} className="py-20 bg-white dark:bg-slate-900">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div 
            className={`transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Complete <span className="text-indigo-600 dark:text-indigo-400">Business Management</span> Platform
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Rising BSM combines powerful features to create an all-in-one solution for modern businesses. Open source and built to scale.
            </p>
          </div>
        </div>

        {/* Feature tabs */}
        <div className="mb-12">
          <div 
            className={`flex flex-wrap justify-center gap-2 md:gap-4 transition-all duration-700 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center px-4 py-2 md:px-6 md:py-3 rounded-lg transition-all ${
                  activeTab === index
                    ? `bg-gradient-to-r ${feature.color} text-white shadow-lg`
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className={activeTab === index ? 'mr-2' : 'mr-2'}>
                  {feature.icon}
                </span>
                <span className="font-medium">{feature.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature details */}
        <div 
          className={`grid md:grid-cols-7 gap-8 items-center transition-all duration-700 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Feature image */}
          <div className="md:col-span-3 order-2 md:order-1">
            <div className="relative">
              <div className={`absolute inset-0 rounded-2xl blur-2xl opacity-20 ${features[activeTab].bgColor}`}></div>
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                <Image
                  src={features[activeTab].image}
                  alt={features[activeTab].title}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Feature content */}
          <div className="md:col-span-4 order-1 md:order-2">
            <div className={`inline-flex items-center ${features[activeTab].bgColor} bg-opacity-50 dark:bg-opacity-20 px-4 py-2 rounded-full mb-4`}>
              {features[activeTab].icon}
              <span className="ml-2 font-semibold">{features[activeTab].title}</span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${features[activeTab].color}`}>
                {features[activeTab].title}
              </span> for your business
            </h3>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              {features[activeTab].description}
            </p>
            
            <ul className="space-y-3">
              {features[activeTab].points.map((point, idx) => (
                <li key={idx} className="flex items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${features[activeTab].bgColor}`}>
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Additional features grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Settings className="w-6 h-6" />,
              title: "Customizable Workflows",
              description: "Design your own business processes and workflows tailored to your specific needs."
            },
            {
              icon: <Bell className="w-6 h-6" />,
              title: "Smart Notifications",
              description: "Stay informed with real-time alerts for important events and activities."
            },
            {
              icon: <Search className="w-6 h-6" />,
              title: "Powerful Search",
              description: "Find any information instantly with our advanced search capabilities."
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: "Enterprise Security",
              description: "Keep your data safe with best-in-class security practices and protocols."
            }
          ].map((item, index) => (
            <div 
              key={index}
              className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow border border-slate-100 dark:border-slate-700 transition-all duration-700 hover:shadow-lg transform hover:-translate-y-1 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${800 + index * 100}ms` }}
            >
              <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
