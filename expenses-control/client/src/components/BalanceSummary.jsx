import React from 'react';
import { useTranslation } from '../i18n';

/**
 * Balance summary card with improved spacing, contrast, and touch targets.
 */
export default function BalanceSummary({ balances, currentUserId }) {
  const { t } = useTranslation();

  if (!balances || balances.length === 0) return null;

  const activeBalances = balances.filter(b => Math.abs(b.balance) > 0.01);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
      <h3 className="font-semibold text-slate-800 mb-4 text-base leading-snug">
        {typeof t === 'function' ? t('balances') : 'Balances'}
      </h3>
      {activeBalances.length === 0 ? (
        <p className="text-center text-slate-400 py-4 text-sm leading-relaxed">✅ All settled up!</p>
      ) : (
        <div className="space-y-2">
          {activeBalances.map(b => (
            <div
              key={b.userId}
              className={`flex justify-between items-center p-4 rounded-xl ${
                b.userId === currentUserId
                  ? b.balance >= 0 ? 'bg-emerald-50/80' : 'bg-rose-50/80'
                  : 'bg-slate-50'
              }`}
            >
              <span className="font-medium text-sm text-slate-900 leading-relaxed">
                {b.userId === currentUserId ? 'You' : b.name}
              </span>
              <span className={`font-bold text-sm leading-relaxed ${
                b.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {b.balance >= 0
                  ? `${typeof t === 'function' ? t('owes_you') : 'Owes you'} $${b.balance.toFixed(2)}`
                  : `${typeof t === 'function' ? t('you_owe') : 'You owe'} $${Math.abs(b.balance).toFixed(2)}`
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
