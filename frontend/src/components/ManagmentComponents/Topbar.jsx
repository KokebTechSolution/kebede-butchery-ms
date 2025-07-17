import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import UserProfile from "./UserProfile";

const LANGUAGES = [
  { code: "en", label: "English", icon: "🇬🇧" },
  { code: "am", label: "አማርኛ", icon: "🇪🇹" },
  { code: "om", label: "Afaan Oromoo", icon: "🌍" },
];

const Topbar = () => {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();

  const first_name = user?.first_name || "Guest User";
  const role = user?.role || "No Role";

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <header className="bg-gradient-to-r from-red-800 via-red-800 to-red-700 h-16 px-4 shadow-md flex items-center justify-between">
      {/* Left: logo + brand */}
      <div className="flex items-center gap-2">
        <img
          src="/Kebedelogo.png"
          alt="Kebede logo"
          className="h-12 w-12 object-contain"
        />
        <div className="leading-none">
          <h1 className="text-xl md:text-2xl font-extrabold text-black">Kebede Butchery</h1>
          <span className="text-sm md:text-base text-white tracking-wide">Management System</span>
        </div>
      </div>

      {/* Right: user name, role, profile & language switcher */}
      <div className="flex items-center gap-4 text-white">
        <div className="flex flex-col items-end leading-tight text-sm">
          <span className="font-semibold">{first_name}</span>
          <span className="opacity-80">{role}</span>
        </div>
        {/* Language Switcher */}
        <div className="flex items-center gap-1">
          <span className="hidden md:inline font-semibold">{t("choose_language") || "Language"}:</span>
          <select
            value={i18n.language}
            onChange={handleLanguageChange}
            className="rounded px-2 py-1 text-black bg-white focus:outline-none"
            style={{ minWidth: "120px" }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>
        </div>
        {/* Ensure the avatar/icon inherits white color */}
        <UserProfile className="text-white" />
      </div>
    </header>
  );
};

export default Topbar;