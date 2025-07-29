import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

const ResponsiveLayout = ({ 
  children, 
  sidebar, 
  header, 
  footer,
  showSidebar = true,
  showHeader = true,
  showFooter = false,
  className = ""
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      {isMobile && showHeader && (
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {showSidebar && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <Menu size={20} />
                </button>
              )}
              <div className="flex-1">
                {header}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Desktop Header */}
      {!isMobile && showHeader && (
        <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          {header}
        </header>
      )}

      <div className="flex h-screen">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={closeSidebar}
              />
            )}

            {/* Sidebar */}
            <aside
              className={`${
                isMobile
                  ? `fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
                      isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`
                  : 'w-64 bg-white shadow-sm border-r border-gray-200'
              }`}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Sidebar Header */}
                {isMobile && (
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                    <button
                      onClick={closeSidebar}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Close sidebar"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto">
                  {sidebar}
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className={`flex-1 flex flex-col ${showSidebar ? 'lg:ml-0' : ''}`}>
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>

          {/* Footer */}
          {showFooter && footer && (
            <footer className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6 lg:px-8">
              {footer}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveLayout; 