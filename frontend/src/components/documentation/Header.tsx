import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Menu, X, Moon, Sun, Search } from 'lucide-react';

type HeaderProps = {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
};

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleSidebar} 
            className="inline-flex md:hidden items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl text-gray-900 dark:text-white">Rising BSM</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Docs</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {searchOpen ? (
            <div className="relative">
              <input
                type="search"
                placeholder="Search documentation..."
                className="w-full md:w-64 h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          )}
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;