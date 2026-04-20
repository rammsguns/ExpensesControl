import React from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

export default function Account() {
  const { t, language } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {language === 'es' ? 'Cuenta' : 'Account'}
        </h2>

        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mx-auto mb-3">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-bold text-gray-800">{user?.name}</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        {/* Settings */}
        <div className="mt-6 space-y-2">
          <div className="bg-white rounded-xl shadow-sm border p-4 flex justify-between items-center">
            <span className="text-gray-700 text-sm font-medium">
              {language === 'es' ? 'Idioma' : 'Language'}
            </span>
            <span className="text-gray-500 text-sm">
              {language === 'es' ? '🇲🇸 Español' : '🇺🇸 English'}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 flex justify-between items-center">
            <span className="text-gray-700 text-sm font-medium">
              {language === 'es' ? 'Moneda' : 'Currency'}
            </span>
            <span className="text-gray-500 text-sm">MXN</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2">
          <button
            onClick={logout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-xl px-4 py-3 font-medium text-sm transition"
          >
            {t('logout')}
          </button>
        </div>

        {/* About */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>ExpensesControl MVP v0.1.0</p>
          <p className="mt-1">Hecho con 💚</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}