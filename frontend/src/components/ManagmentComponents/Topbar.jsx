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
  const { i18n, t } = useTranslation();
  const first_name = user?.first_name || "Guest";
  const role = user?.role || "No Role";

  return (
    <header className="bg-gradient-to-r from-red-800 via-red-800 to-red-700 h-16 px-4 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/Kebedelogo.png" alt="Kebede logo" className="h-12 w-12 object-contain" />
        <div className="leading-none">
          <h1 className="text-xl md:text-2xl font-extrabold text-black">Kebede Butchery</h1>
          <span className="text-sm md:text-base text-white tracking-wide">Management System</span>
        </div>
      </div>
      <div className="flex items-center gap-6 text-white">
        <div className="flex items-center gap-1">
          <span className="hidden md:inline font-semibold">{t("choose_language") || "Language"}:</span>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="rounded px-2 py-1 text-black bg-white focus:outline-none"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.icon} {lang.label}</option>
            ))}
          </select>
        </div>
        <UserProfile first_name={first_name} role={role} />
      </div>
    </header>
  );
};

export default Topbar;
