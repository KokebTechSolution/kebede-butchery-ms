// Topbar.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import UserProfile from "./UserProfile";

const LANGUAGES = [
  { code: "en", label: "English", icon: "🇬🇧" },
  { code: "am", label: "አማርና", icon: "🇪🇹" },
  { code: "om", label: "Afaan Oromoo", icon: "🌍" },
];

const Topbar = () => {
  const { user } = useAuth();
  console.log("Topbar user state:", user, "path:", window.location.pathname);
  const { i18n, t } = useTranslation();
  const first_name = user?.first_name || "Guest";
  const role = user?.role || "No Role";

  return (
    <header className="bg-gradient-to-r from-red-900 via-red-800 to-red-700 px-4 md:px-6 shadow-lg rounded-b-2xl border-b border-red-900">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 pt-4">
        <a href="/" className="transition-transform hover:scale-105 shrink-0">
          <img src="/Kebedelogo.png" alt="Kebede logo" className="h-12 w-12 md:h-14 md:w-14 object-contain rounded-full shadow-md" />
        </a>
        <div className="leading-none truncate">
          <h1 className="text-lg md:text-2xl font-extrabold text-white drop-shadow truncate">Kebede Butchery</h1>
          <span className="text-xs md:text-base text-gray-200 tracking-wide font-semibold truncate">Management System</span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-2 pb-4">
        <div className="flex items-center gap-1 md:gap-2">
          <span className="hidden md:inline font-semibold">{t("choose_language") || "Language"}:</span>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="rounded px-3 py-2 text-black bg-white focus:outline-none border border-gray-300 shadow-sm text-sm"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.icon} {lang.label}</option>
            ))}
          </select>
        </div>
        {/* Only show UserProfile if user is authenticated and not on login page */}
        {user && user.isAuthenticated && window.location.pathname !== '/login' && <UserProfile first_name={first_name} role={role} />}
      </div>
    </header>
  );
};

export default Topbar;
