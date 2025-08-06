import React, { useState } from "react";
import { Separator } from "../../components/ui/separator";
import { OrdersSection } from "./sections/OrdersSection";
import { SidebarSection } from "./sections/SidebarSection";
import { WaitersSection } from "./sections/WaitersSection";
import { ShiftCheckoutSection } from "./sections/ShiftCheckoutSection";
import { ReportSection } from "./sections/ReportSection";

export const StitchDesign = () => {
  const [activeSection, setActiveSection] = useState("orders");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderMainContent = () => {
    switch (activeSection) {
      case "orders":
        return <SidebarSection />;
      case "waiters":
        return <WaitersSection />;
      case "checkout":
        return <ShiftCheckoutSection />;
      case "report":
        return <ReportSection />;
      default:
        return <SidebarSection />;
    }
  };

  // Close mobile menu when section changes
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -m-2 text-gray-700 hover:text-orange-600 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {activeSection === 'orders' && 'Orders'}
            {activeSection === 'waiters' && 'Waiters'}
            {activeSection === 'checkout' && 'Shift Checkout'}
            {activeSection === 'report' && 'Reports'}
          </h1>
        </div>
        <div className="flex items-center">
          <button className="p-2 -m-2 text-gray-600 hover:text-orange-600 focus:outline-none">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out bg-white border-r h-screen overflow-y-auto`}>
        <OrdersSection 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange} 
        />
      </div>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
        <div className="p-4 md:p-6">
          {renderMainContent()}
        </div>
      </main>
    </div>
  );
};