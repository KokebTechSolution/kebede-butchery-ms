import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          unauthorized: 'Unauthorized',
          owner_dashboard: 'Owner Dashboard',
          manager_dashboard: 'Manager Dashboard',
          waiter_dashboard: 'Waiter Dashboard',
          cashier_dashboard: 'Cashier Dashboard',
          bartender_dashboard: 'Bartender Dashboard',
          meat_dashboard: 'Meat Dashboard',
        },
      },
      am: {
        translation: {
          unauthorized: 'ያልተፈቀደ',
          owner_dashboard: 'የባለቤት ዳሽቦርድ',
          manager_dashboard: 'የአስተዳዳሪ ዳሽቦርድ',
          waiter_dashboard: 'የአገልጋይ ዳሽቦርድ',
          cashier_dashboard: 'የካሽየር ዳሽቦርድ',
          bartender_dashboard: 'የባርቴንደር ዳሽቦርድ',
          meat_dashboard: 'የስጋ ዳሽቦርድ',
        },
      },
      om: {
        translation: {
          unauthorized: 'Hayyamamuu hin dandeenye',
          owner_dashboard: 'Daashboordii Abbaa Qabeenyaa',
          manager_dashboard: 'Daashboordii Bulchaa',
          waiter_dashboard: 'Daashboordii Tajaajilaa',
          cashier_dashboard: 'Daashboordii Kaashiyaa',
          bartender_dashboard: 'Daashboordii Bartender',
          meat_dashboard: 'Daashboordii Foonii',
        },
      },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;