'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, PlusCircle, MinusCircle } from 'lucide-react';

/**
 * FAQ component for the landing page
 * 
 * Displays frequently asked questions in an accordion format
 * with modern design elements and animations.
 */
const FAQ = () => {
  const faqRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

    if (faqRef.current) {
      observer.observe(faqRef.current);
    }

    return () => {
      if (faqRef.current) {
        observer.unobserve(faqRef.current);
      }
    };
  }, []);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What exactly is Rising BSM?",
      answer: "Rising BSM is an open-source platform for developing AI-powered business service management solutions. It provides core functionality for customer relationship management, appointment scheduling, and request handling, all integrated with AI assistants to automate routine tasks."
    },
    {
      question: "Is Rising BSM really free to use?",
      answer: "Yes, Rising BSM is 100% free and open-source. You can use it for personal or commercial projects without any licensing fees. The code is available on GitHub under an open-source license, allowing you to modify, extend, and customize it to your needs."
    },
    {
      question: "What technologies does Rising BSM use?",
      answer: "Rising BSM is built with modern, production-ready technologies including Next.js 15 for the frontend and server components, Prisma as the ORM for database operations, and Tailwind CSS for styling. It follows best practices for performance, accessibility, and maintainability."
    },
    {
      question: "Do I need coding knowledge to use Rising BSM?",
      answer: "Basic knowledge of JavaScript/TypeScript and React is helpful for customizing Rising BSM to your specific needs. However, many users can deploy and use the platform with minimal technical knowledge, especially if you're using it as-is without custom modifications."
    },
    {
      question: "Can I integrate Rising BSM with other tools?",
      answer: "Absolutely! Rising BSM is designed with extensibility in mind. It provides APIs for integration with third-party services and tools. The modular architecture makes it straightforward to add new features or connect to external systems like payment processors, calendaring services, or marketing platforms."
    },
    {
      question: "How can I contribute to the project?",
      answer: "We welcome contributions of all kinds! You can contribute by reporting bugs, suggesting features, improving documentation, or submitting code improvements. Check out our GitHub repository for contribution guidelines and open issues."
    }
  ];

  return (
    <section id="faq" ref={faqRef} className="py-20 bg-slate-50 dark:bg-slate-800/50">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto">
          <div 
            className={`text-center mb-12 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked <span className="text-indigo-600 dark:text-indigo-400">Questions</span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Find answers to common questions about Rising BSM and how it can help your business.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className={`bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 ${
                  openIndex === index ? 'shadow-md' : ''
                } ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <button
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                  onClick={() => toggleQuestion(index)}
                  aria-expanded={openIndex === index}
                >
                  <span className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                    {faq.question}
                  </span>
                  <span className={`text-indigo-600 dark:text-indigo-400 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}>
                    {openIndex === index ? 
                      <MinusCircle className="w-5 h-5" /> : 
                      <PlusCircle className="w-5 h-5" />
                    }
                  </span>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 text-slate-600 dark:text-slate-300">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div 
            className={`mt-12 text-center transition-all duration-700 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Have more questions? We're here to help!
            </p>
            <a 
              href="https://github.com/Virtus92/Rising-BSM/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all"
            >
              <ChevronDown className="mr-2 w-5 h-5" />
              <span>Visit Our Community</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
