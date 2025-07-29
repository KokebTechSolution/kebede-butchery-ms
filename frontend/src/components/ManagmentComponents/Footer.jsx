import React from "react";

const Footer = () => (
  <footer className="w-full flex flex-col md:flex-row flex-wrap items-center justify-between bg-gradient-to-r from-white via-gray-100 to-gray-200 border-t border-gray-200 p-4 md:p-6 mt-8 rounded-b-2xl shadow-lg gap-2 md:gap-4 text-center md:text-left">
    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 min-w-0">
      <div className="flex items-center gap-2 shrink-0">
        <img src="/Kebedelogo.png" alt="Kebede Butchery Logo" className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-full shadow" />
        <span className="font-extrabold text-base md:text-xl text-gray-800 tracking-wide drop-shadow truncate">Kebede Butchery</span>
      </div>
      <span className="text-xs text-gray-400 md:ml-4 truncate">&copy; 2025 Kebede Butchery. All rights reserved.</span>
    </div>
    <div className="flex items-center gap-1 md:gap-3 flex-wrap justify-center md:justify-end">
      <span className="text-gray-500 text-sm md:text-base font-medium">Developed by</span>
      <a href="https://aurarise.com" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110 shrink-0">
        <img src="/aurarise-logo.png" alt="Aurarise Tech Solutions Logo" className="h-7 w-7 md:h-8 md:w-8 object-contain rounded-full shadow-md" />
      </a>
      <span className="font-bold text-sm md:text-base text-blue-700 tracking-wide truncate">Aurarise Tech Solutions</span>
    </div>
  </footer>
);

export default Footer; 