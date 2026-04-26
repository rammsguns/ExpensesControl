import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { DollarSign } from 'lucide-react';
import AccessibilityToggle from './AccessibilityToggle';

export default function Navbar() {
  const { t, language, changeLanguage } = useTranslation();
  const { logout } = useAuth();

  return (
    <nav className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-600 flex items-center gap-2 min-h-[44px] focus-ring">
          <DollarSign size={24} aria-hidden="true" />
          <span className="leading-tight">ExpensesControl</span>
        </Link>
        <div className="flex items-center gap-2">
          <AccessibilityToggle />
          <button
            onClick={() => changeLanguage(language === 'en' ? 'es' : 'en')}
            className="min-h-[44px] flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 rounded-lg font-medium transition-colors duration-150 focus-ring"
            aria-label={language === 'en' ? 'Cambiar a español' : 'Switch to English'}
          >
            <span className={`px-1.5 py-0.5 rounded ${language === 'en' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-400'}`}>EN</span>
            <span className="text-slate-300">/</span>
            <span className={`px-1.5 py-0.5 rounded ${language === 'es' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-400'}`}>ES</span>
          </button>
          <button
            onClick={logout}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm text-slate-500 hover:text-rose-500 transition-colors duration-150 rounded-lg focus-ring px-3"
            aria-label={t('logout')}
          >
            {t('logout')}
          </button>
        </div>
      </div>
    </nav>
  );
}
