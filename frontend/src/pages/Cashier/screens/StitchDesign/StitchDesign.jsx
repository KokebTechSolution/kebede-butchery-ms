import React, { useState } from "react";
import { Separator } from "../../components/ui/separator";
import { OrdersSection } from "./sections/OrdersSection";
import { SidebarSection } from "./sections/SidebarSection";
import { WaitersSection } from "./sections/WaitersSection";
import { ShiftCheckoutSection } from "./sections/ShiftCheckoutSection";
import { ReportSection } from "./sections/ReportSection";

export const StitchDesign = () => {
  const [activeSection, setActiveSection] = useState("orders");

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

  return (
    <main className="bg-gray-50 w-full min-h-screen">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-row items-start p-6 gap-4 h-full">
        <div className="flex-1">
          <OrdersSection 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        </div>
        <Separator orientation="vertical" className="h-auto" />
        <div className="flex-[3]">
          {renderMainContent()}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden bg-gray-50 min-h-screen">
        <OrdersSection 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <div className="p-4 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </main>
  );
};