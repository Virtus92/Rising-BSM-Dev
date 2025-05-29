import { Metadata } from 'next';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import Hero from '@/features/home/components/Hero';
import Services from '@/features/home/components/Services';
import About from '@/features/home/components/About';
import Features from '@/features/home/components/Features';
import Testimonials from '@/features/home/components/Testimonials';
import FAQ from '@/features/home/components/FAQ';
import CTA from '@/features/home/components/CTA';
import Contact from '@/features/home/components/Contact';
import RequestShowcase from '@/features/home/components/RequestShowcase';

export const metadata: Metadata = {
  title: 'RISING BS e.U. - Professionelle Gebäudebetreuung in Linz',
  description: 'Ihr zuverlässiger Partner für Winterdienst, Grünflächenbetreuung, Reinigung und mehr in Linz und Umgebung.',
  keywords: 'Winterdienst, Grünflächenbetreuung, Reinigung, Gebäudebetreuung, Linz, Oberösterreich',
};

/**
 * Landing Page / Home
 * 
 * Professional landing page for RISING BS e.U. facility management company
 * showcasing services, company values and contact information.
 */
export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Header />
      <Hero />
      <Services />
      <About />
      <Features />
      <FAQ />
      <RequestShowcase />
      <CTA />
      <Footer />
    </main>
  );
}
