import React from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { LogOut, Crown, Zap, Infinity, CheckCircle, ChevronDown, Star } from 'lucide-react';
import api from '../api';
import { toast } from 'react-hot-toast';

export default function Account() {
  const { t, language } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const [upgrading, setUpgrading] = React.useState(false);
  const [changingCurrency, setChangingCurrency] = React.useState(false);
  const [newCurrency, setNewCurrency] = React.useState(user?.currency || 'USD');

  React.useEffect(() => {
    refreshUser();
  }, []);

  React.useEffect(() => {
    setNewCurrency(user?.currency || 'USD');
  }, [user?.currency]);

  const isPremium = user?.is_premium;
  const limit = user?.monthly_expense_limit || 100;
  const used = user?.monthly_expense_count || 0;

  const currencies = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷' },
    { code: 'ARS', name: 'Argentine Peso', flag: '🇦🇷' },
    { code: 'COP', name: 'Colombian Peso', flag: '🇨🇴' },
    { code: 'CLP', name: 'Chilean Peso', flag: '🇨🇱' },
    { code: 'PEN', name: 'Peruvian Sol', flag: '🇵🇪' },
  ];

  const handleChangeCurrency = async () => {
    setChangingCurrency(true);
    try {
      await api.put('/auth/currency', { currency: newCurrency });
      toast.success(language === 'es' ? 'Moneda actualizada' : 'Currency updated');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update currency');
    } finally {
      setChangingCurrency(false);
    }
  };

  const handleUpgrade = async () => {
    if (!window.confirm(language === 'es' 
      ? '¿Activar Premium por $3/mes? (Simulado - sin pago real)'
      : 'Activate Premium for $3/month? (Simulated - no real payment)'
    )) return;

    setUpgrading(true);
    try {
      const response = await api.post('/auth/upgrade');
      if (response.data.is_premium) {
        toast.success(language === 'es' ? '¡Premium activado!' : 'Premium activated!');
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 safe-area-bottom">
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
              
              {/* Benefits list */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{language === 'es' ? 'Gastos ilimitados' : 'Unlimited expenses'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{language === 'es' ? 'Grupos ilimitados' : 'Unlimited groups'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{language === 'es' ? 'Miembros ilimitados por grupo' : 'Unlimited members per group'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{language === 'es' ? 'Soporte prioritario' : 'Priority support'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{language === 'es' ? 'Sin anuncios' : 'No ads'}</span>
                </div>
              </div>

              {/* Usage bar */}
              <div className="mt-4">
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
              
              {/* Upgrade button */}
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition focus-ring disabled:opacity-50"
              >
                {upgrading 
                  ? (language === 'es' ? 'Activando...' : 'Activating...')
                  : (language === 'es' ? 'Activar Premium — $3/mes' : 'Activate Premium — $3/month')
                }
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                {language === 'es' 
                  ? 'Pago simulado — sin procesamiento real'
                  : 'Simulated payment — no real processing'
                }
              </p>
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
          
          {/* Currency selector */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-700 text-sm font-medium">
                {language === 'es' ? 'Moneda predeterminada' : 'Default Currency'}
              </span>
              <span className="text-slate-500 text-sm">{user?.currency || 'USD'}</span>
            </div>
            <div className="relative">
              <select
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-base appearance-none bg-white focus:ring-2 focus:ring-indigo-500 outline-none min-h-[44px]"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
            </div>
            <button
              onClick={handleChangeCurrency}
              disabled={changingCurrency || newCurrency === (user?.currency || 'USD')}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg px-4 py-2 font-medium text-sm transition"
            >
              {changingCurrency 
                ? (language === 'es' ? 'Guardando...' : 'Saving...')
                : (language === 'es' ? 'Cambiar moneda' : 'Change Currency')
              }
            </button>
          </div>
        </div>

        {/* Rate App */}
        <div className="mt-4">
          <a
            href="https://play.google.com/store/apps/details?id=com.expensescontrol"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:bg-slate-50 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {language === 'es' ? 'Calificar en Play Store' : 'Rate on Play Store'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {language === 'es' ? 'Nos ayuda mucho tu opinión' : 'Your feedback helps us improve'}
                  </p>
                </div>
              </div>
              <span className="text-slate-400 text-lg">&gt;</span>
            </div>
          </a>
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
