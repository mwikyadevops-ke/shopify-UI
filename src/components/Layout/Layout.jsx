import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useGlobalShortcuts } from '../../hooks/useKeyboardShortcuts';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  // Enable global keyboard shortcuts
  useGlobalShortcuts();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="layout">
      <Sidebar 
        isMobile={isMobile}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />
      {isMobileMenuOpen && isMobile && (
        <div 
          className="mobile-overlay"
          onClick={closeMobileMenu}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}
      <div className="main-content">
        <Header 
          onMenuToggle={toggleMobileMenu}
          isMobile={isMobile}
        />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;


