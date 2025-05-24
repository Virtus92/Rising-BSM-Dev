'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

/**
 * ScreenshotShowcase component for the Landing page
 * 
 * Displays organized screenshots of the Rising BSM platform features
 * with a modern gallery interface and lightbox functionality.
 */
const ScreenshotShowcase = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

    if (showcaseRef.current) {
      observer.observe(showcaseRef.current);
    }

    return () => {
      if (showcaseRef.current) {
        observer.unobserve(showcaseRef.current);
      }
    };
  }, []);

  const categories = [
    {
      name: 'Dashboard & Analytics',
      description: 'Real-time insights and business performance metrics',
      icon: '📊',
      images: [
        { src: '/images/screenshots/dashboard/Mainpage.png', title: 'Main Dashboard - Welcome & Overview' },
        { src: '/images/screenshots/dashboard/Statistics.png', title: 'Business Analytics & Statistics' },
      ]
    },
    {
      name: 'Customer Management',
      description: 'Complete CRM solution with detailed customer profiles and history',
      icon: '👥',
      images: [
        { src: '/images/screenshots/customers/CustomerList.png', title: 'Customer Directory' },
        { src: '/images/screenshots/customers/CustomerDetail.png', title: 'Customer Profile & History' },
        { src: '/images/screenshots/customers/AddCustomer.png', title: 'Add New Customer Form' },
        { src: '/images/screenshots/customers/EditCustomer.png', title: 'Edit Customer Information' },
      ]
    },
    {
      name: 'User & Permissions',
      description: 'Advanced user management with granular permission control',
      icon: '🔐',
      images: [
        { src: '/images/screenshots/users/UsersList.png', title: 'User Management Dashboard' },
        { src: '/images/screenshots/users/UserDetail.png', title: 'User Profile Details' },
        { src: '/images/screenshots/users/AddUser.png', title: 'Create New User' },
        { src: '/images/screenshots/users/UserPermissions.png', title: 'User-Specific Permissions' },
        { src: '/images/screenshots/users/Permissions.png', title: 'System Permission Overview' },
      ]
    },
    {
      name: 'Service Management',
      description: 'Track requests and manage appointments efficiently',
      icon: '📋',
      images: [
        { src: '/images/screenshots/requests/RequestDetail.png', title: 'Service Request Details' },
        { src: '/images/screenshots/requests/AppointmentDetail.png', title: 'Appointment Management' },
      ]
    },
    {
      name: 'Automation & Integration',
      description: 'Webhook integrations and workflow automation tools',
      icon: '⚡',
      images: [
        { src: '/images/screenshots/automation/Automation.png', title: 'Automation Hub' },
        { src: '/images/screenshots/automation/CreateWebhook.png', title: 'Webhook Configuration' },
        { src: '/images/screenshots/automation/CreateWebhook2.png', title: 'Event Selection' },
        { src: '/images/screenshots/automation/CreateWebhook3.png', title: 'Integration Testing' },
      ]
    },
  ];

  const currentCategory = categories[activeCategory];
  const allImages = categories.flatMap(cat => cat.images);

  const handlePrevImage = () => {
    const prevIndex = currentImageIndex > 0 ? currentImageIndex - 1 : allImages.length - 1;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(allImages[prevIndex]);
  };

  const handleNextImage = () => {
    const nextIndex = currentImageIndex < allImages.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(allImages[nextIndex]);
  };

  const openLightbox = (image: { src: string; title: string }) => {
    const index = allImages.findIndex(img => img.src === image.src);
    setCurrentImageIndex(index);
    setSelectedImage(image);
  };

  return (
    <section id="screenshots" ref={showcaseRef} className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div 
            className={`transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-4">
              Platform Overview
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Experience <span className="text-indigo-600 dark:text-indigo-400">Rising BSM</span> in Action
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              Explore our intuitive interface designed for efficiency and ease of use
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-2xl mx-auto">
              {[
                { icon: '🚀', label: 'Fast & Responsive' },
                { icon: '🎨', label: 'Modern Design' },
                { icon: '🔧', label: 'Customizable' },
                { icon: '📱', label: 'Mobile Ready' },
              ].map((item, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-12">
          <div 
            className={`flex flex-wrap justify-center gap-2 md:gap-4 transition-all duration-700 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(index)}
                className={`flex items-center px-4 py-2 md:px-6 md:py-3 rounded-lg transition-all ${
                  activeCategory === index
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="mr-2 text-lg">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category description */}
        <div 
          className={`text-center mb-12 transition-all duration-700 delay-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {currentCategory.description}
          </p>
        </div>

        {/* Screenshot grid */}
        <div 
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {currentCategory.images.map((image, index) => (
            <div
              key={index}
              className="group relative rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-600 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              onClick={() => openLightbox(image)}
            >
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-700">
                <Image
                  src={image.src}
                  alt={image.title}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-lg font-semibold flex items-center">
                    {image.title}
                    <Maximize2 className="ml-2 h-4 w-4" />
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              
              <div className="relative max-h-[90vh] max-w-full">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  width={1920}
                  height={1080}
                  className="object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <h3 className="text-white text-xl font-semibold">{selectedImage.title}</h3>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>

              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ScreenshotShowcase;