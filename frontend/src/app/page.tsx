import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Services from '@/components/home/Services';
import About from '@/components/home/About';
import Contact from '@/components/home/Contact';

export const metadata = {
  title: 'Rising BSM - Ihre Allround-Experten',
  description: 'Facility Management, Umzüge & Transporte, Winterdienst - Maßgeschneiderte Lösungen für Ihr Anliegen.',
  keywords: ['Facility Management', 'Umzüge', 'Transporte', 'Winterdienst', 'Hausbetreuung', 'Linz', 'Österreich'],
};

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