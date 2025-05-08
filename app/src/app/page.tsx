import { Metadata } from 'next';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import Hero from '@/features/home/components/Hero';
import Features from '@/features/home/components/Features';
import About from '@/features/home/components/About';
import Testimonials from '@/features/home/components/Testimonials';
import CTA from '@/features/home/components/CTA';
import FAQ from '@/features/home/components/FAQ';

export const metadata: Metadata = {
  title: 'Rising BSM - AI-Powered Business Service Management',
  description: 'Open source platform for personal AI assistants handling requests, customer and appointment management.',
  keywords: 'AI Assistant, Business Management, Customer Management, Appointment Management, Open Source',
};

/**
 * Landing Page / Home
 * 
 * A modern landing page showcasing the open-source Rising BSM platform
 * for AI-powered business service management.
 */
export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Header />
      <Hero />
      <Features />
      <About />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
