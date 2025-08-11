import React from "react";
import "./BottomNav.css";

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {/* These links do not navigate to separate routes, but should trigger section changes in MeatDashboard. */}
      <a href="#orders" className="nav-link">Orders</a>
      <a href="#inventory" className="nav-link">Inventory</a>
    </nav>
  );
}
