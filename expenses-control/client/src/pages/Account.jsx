import React from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { LogOut, Crown, Zap, Infinity } from 'lucide-react';

export default function Account() {
  const { t, language } = useTranslation();
  const { user, logout, refreshUser } = useAuth();

  React.useEffect(() => {
    refreshUser();
  }, []);

  const isPremium = user?.is_premium;
  const limit = user?.monthly_expense_limit || 100;
  const used = user?.monthly_expense_count || 0;

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
          
          {/* Premium badge */}
          {isPremium && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium border border-amber-200">
              <Crown size={14} /> {t('premium_active')}
            </div>
          )}
        </div>

        {/* Premium Section */}
        <div className="mt-6">
          {isPremium ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Crown size={20} className="text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{t('premium_active')}</h4>
                  <p className="text-sm text-slate-500">{t('premium_desc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                <Infinity size={16} />
                <span>{t('unlimited')} {t('expenses').toLowerCase()}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Zap size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{t('upgrade_to_premium')}</h4>
                  <p className="text-sm text-slate-500">{t('premium_benefits')}</p>
                </div>
              </div>
              
              {/* Usage bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{t('monthly_limit')}</span>
                  <span className="text-slate-500">{used} / {limit}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'es' 
                    ? `${used} de ${limit} gastos usados este mes`
                    : `${used} of ${limit} expenses used this month`
                  }
                </p>
              </div>
              
              {/* Upgrade button (placeholder - no payment integration yet) */}
              <button
                disabled
                className="mt-4 w-full bg-indigo-600 text-white rounded-lg px-4 py-2.5 font-medium text-sm opacity-50 cursor-not-allowed"
                title="Payment integration coming soon"
              >
                {t('upgrade_to_premium')}
              </button>
            </div>
          )}
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

      </div>
      <BottomNav />
    </div>
  );
}
