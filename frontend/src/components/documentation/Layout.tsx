import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handleRouteChange = () => {
      setIsSidebarOpen(false);
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Check if we're in a documentation page or app directory page
  // If the pathname starts with /docs, we're in documentation
  const isDocsPage = router.pathname.startsWith('/docs') || router.pathname === '/';
  const isAppDirPage = !isDocsPage;
  
  // For app directory routes, return just the children to avoid layering issues
  if (isAppDirPage) {
    return <>{children}</>;
  }
  
  // Documentation layout
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex flex-1">
        {router.pathname !== '/' && <Sidebar isOpen={isSidebarOpen} />}
        
        <main className={`flex-1 ${router.pathname !== '/' ? 'md:ml-64' : ''} px-4 py-8 md:px-8`}>
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
      
      <div className={router.pathname !== '/' ? 'md:ml-64' : ''}>
        <Footer />
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;