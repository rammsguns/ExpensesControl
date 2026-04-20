import React from 'react';
import { useTranslation } from '../i18n';

export default function BalanceSummary({ balances, currentUserId }) {
  const { t } = useTranslation();

  if (!balances || balances.length === 0) return null;

  const activeBalances = balances.filter(b => Math.abs(b.balance) > 0.01);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <h3 className="font-semibold text-gray-700 mb-3">{t('balances')}</h3>
      {activeBalances.length === 0 ? (
        <p className="text-center text-gray-400 py-2">✅ All settled up!</p>
      ) : (
        <div className="space-y-2">
          {activeBalances.map(b => (
            <div
              key={b.userId}
              className={`flex justify-between items-center p-3 rounded-lg ${
                b.userId === currentUserId
                  ? b.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                  : 'bg-gray-50'
              }`}
            >
              <span className="font-medium text-sm">
                {b.userId === currentUserId ? 'You' : b.name}
              </span>
              <span className={`font-bold text-sm ${
                b.balance >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {b.balance >= 0
                  ? `${t('owes_you')} $${b.balance.toFixed(2)}`
                  : `${t('you_owe')} $${Math.abs(b.balance).toFixed(2)}`
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}