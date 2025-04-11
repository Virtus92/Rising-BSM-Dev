'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

/**
 * Auth-Layout
 * 
 * Gemeinsames Layout für alle Authentifizierungsseiten (Login, Register, etc.)
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration-Schutz für Theme-Toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme wechseln
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Header mit Logo und Theme-Toggle */}
      <header className="w-full py-4 px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-500">
            RISING BSM
          </div>
        </Link>
        
        {/* Theme-Toggle */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label={theme === 'dark' ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln'}
          >
            {theme === 'dark' ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>
        )}
      </header>

      {/* Hauptbereich mit dem Auth-Inhalt */}
      <main className="flex-grow flex items-center justify-center p-4">
          {children}
      </main>

      {/* Footer mit Links und Copyright */}
      <footer className="py-4 px-4 text-center text-gray-600 dark:text-gray-400 text-sm">
        <div className="mb-2">
          <Link href="/terms" className="hover:text-green-600 dark:hover:text-green-500 mx-2">Nutzungsbedingungen</Link>
          <Link href="/privacy" className="hover:text-green-600 dark:hover:text-green-500 mx-2">Datenschutz</Link>
          <Link href="/imprint" className="hover:text-green-600 dark:hover:text-green-500 mx-2">Impressum</Link>
        </div>
        <div>
          &copy; {new Date().getFullYear()} RISING BSM. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
}
