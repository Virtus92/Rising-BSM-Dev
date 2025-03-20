'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Phone, WrenchIcon } from 'lucide-react';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const slides = [
    {
      image: '/images/facility.jpg',
      alt: 'Facility Management'
    },
    {
      image: '/images/transport.jpg',
      alt: 'Umzüge & Transporte'
    },
    {
      image: '/images/Gym.webp',
      alt: 'Fitness & Sport Betreuung'
    },
    {
      image: '/images/Garden.webp',
      alt: 'Gartenpflege & Außenanlagen'
    }
  ];

  useEffect(() => {
    // Trigger animation when component mounts
    setIsVisible(true);

    // Set up slideshow
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="hero-section">
      {/* Background Slideshow */}
      <div className="hero-backdrop">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Dark Overlay */}
      <div className="hero-overlay" />

      {/* Content */}
      <div className="container mx-auto px-4 z-20 text-center">
        <div className={`transition-all duration-1000 ease-out transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            RISING BSM – Ihre Allround-Experten
          </h1>
          
          <ul className="text-xl md:text-2xl text-white space-y-1 mb-8">
            <li>Facility Management</li>
          </ul>
          
          <p className="text-xl text-white mb-10">
            Maßgeschneiderte Lösungen für Ihr Anliegen.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="#services" 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition flex items-center justify-center space-x-2 text-lg"
            >
              <WrenchIcon size={20} />
              <span>Unsere Leistungen</span>
            </Link>
            
            <a 
              href="tel:+431234567890" 
              className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-6 py-3 rounded-md transition flex items-center justify-center space-x-2 text-lg"
            >
              <Phone size={20} />
              <span>Jetzt anrufen</span>
            </a>
          </div>
        </div>
      </div>

      {/* Slideshow Indicators */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-white w-6' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;