import { Metadata } from 'next';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import Hero from '@/features/home/components/Hero';
import Services from '@/features/home/components/Services';
import About from '@/features/home/components/About';
import Contact from '@/features/home/components/Contact';

export const metadata: Metadata = {
  title: 'RISING BSM - Ihre Allround-Experten',
  description: 'Facility Management - Maßgeschneiderte Lösungen für Ihr Anliegen.',
  keywords: 'Facility Management, Winterdienst, Hausbetreuung, Linz, Österreich',
};

/**
 * Landing Page / Home
 * 
 * Die Startseite der Anwendung, die die Hauptkomponenten für die öffentliche Website enthält.
 */
export default function Home() {
  return (
      <main className="min-h-screen flex flex-col">
        <Header />
        <Hero />
        <Services />
        <About />
        <Contact />
        <Footer />
      </main>
  );
}
