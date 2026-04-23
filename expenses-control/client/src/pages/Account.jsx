import React from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { User, Globe, CreditCard, LogOut, Shield } from 'lucide-react';

export default function Account() {
  const { t, language } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          {language === 'es' ? 'Cuenta' : 'Account'}
        </h2>

        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl mx-auto mb-3">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>

        {/* Settings */}
        <div className="mt-6 space-y-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex justify-between items-center">
            <span className="text-slate-700 text-sm font-medium">
              {language === 'es' ? 'Idioma' : 'Language'}
            </span>
            <span className="text-slate-500 text-sm">
              {language === 'es' ? '🇲🇽 Español' : '🇺🇸 English'}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex justify-between items-center">
            <span className="text-slate-700 text-sm font-medium">
              {language === 'es' ? 'Moneda' : 'Currency'}
            </span>
            <span className="text-slate-500 text-sm">MXN</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2">
          <button
            onClick={logout}
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl px-4 py-3 font-medium text-sm transition flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> {t('logout')}
          </button>
        </div>

        {/* About */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>ExpensesControl MVP v0.1.0</p>
          <p className="mt-1 flex items-center justify-center gap-2">
            Hecho con <Shield size={12} className="text-indigo-600" />
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
