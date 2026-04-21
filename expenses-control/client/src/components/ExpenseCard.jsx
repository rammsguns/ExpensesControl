import React from 'react';
import { useTranslation } from '../i18n';

export default function ExpenseCard({ expense, currentUser, onEdit, onDelete }) {
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

  const isCreator = expense.paid_by === currentUser?.id;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 truncate">{expense.description}</h4>
          <p className="text-sm text-gray-500 mt-1">
            {expense.paid_by_name || `User ${expense.paid_by}`} • {date}
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
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
      {/* Edit/Delete Actions */}
      {isCreator && (
        <div className="mt-3 pt-2 border-t flex gap-2 justify-end">
          <button
            onClick={() => onEdit?.(expense)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition"
          >
            ✏️ {t('edit')}
          </button>
          <button
            onClick={() => {
              if (window.confirm(t('confirm_delete_expense'))) {
                onDelete?.(expense.id);
              }
            }}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium transition"
          >
            🗑️ {t('delete')}
          </button>
        </div>
      )}
    </div>
  );
}
