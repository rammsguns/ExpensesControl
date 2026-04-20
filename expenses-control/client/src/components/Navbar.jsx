import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { t, language, changeLanguage } = useTranslation();
  const { logout } = useAuth();

  return (
    <nav className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-emerald-600">💰 ExpensesControl</Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeLanguage(language === 'en' ? 'es' : 'en')}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-medium"
          >
            {language === 'en' ? '🇲🇽 ES' : '🇺🇸 EN'}
          </button>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    </nav>
  );
}