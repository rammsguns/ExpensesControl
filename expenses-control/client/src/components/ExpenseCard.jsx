import React from 'react';
import { useTranslation } from '../i18n';

export default function ExpenseCard({ expense, currentUser }) {
  const { t } = useTranslation();

  const date = expense.date
    ? new Date(expense.date).toLocaleDateString()
    : '';

  const splitLabels = {
    equal: t('equal'),
    percentage: t('percentage'),
    exact: t('exact'),
    shares: t('shares'),
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-gray-800">{expense.description}</h4>
          <p className="text-sm text-gray-500 mt-1">
            {expense.paid_by_name || `User ${expense.paid_by}`} • {date}
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-gray-800">${parseFloat(expense.amount).toFixed(2)}</span>
          <span className="block text-xs text-gray-400">{splitLabels[expense.split_type] || expense.split_type}</span>
        </div>
      </div>
      {expense.splits && expense.splits.length > 0 && (
        <div className="mt-2 pt-2 border-t flex flex-wrap gap-2">
          {expense.splits.map((s, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-1 rounded-full ${
                s.id === currentUser?.id ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'
              }`}
            >
              {s.name}: ${parseFloat(s.share_amount || s.amount).toFixed(2)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}