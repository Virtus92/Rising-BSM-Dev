import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RISING BSM - Ihre Allround-Experten',
  description: 'Facility Management - Maßgeschneiderte Lösungen für Ihr Anliegen.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}