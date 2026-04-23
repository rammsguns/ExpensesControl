import React from 'react';
import { useTranslation } from '../i18n';
import { Pencil, Trash2 } from 'lucide-react';

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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition transform hover:scale-[1.02]">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 truncate text-base">{expense.description}</h4>
          <p className="text-xs text-slate-500 mt-1">
            {expense.paid_by_name || `User ${expense.paid_by}`} • {date}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-2xl font-bold text-slate-900">${parseFloat(expense.amount).toFixed(2)}</span>
          <span className="block text-xs text-slate-400 mt-1">{splitLabels[expense.split_type] || expense.split_type}</span>
        </div>
      </div>
      {expense.splits && expense.splits.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
          {expense.splits.map((s, i) => (
            <span
              key={i}
              className={`text-xs px-2.5 py-1.5 rounded-full ${
                s.id === currentUser?.id ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
              }`}
            >
              {s.name}: ${parseFloat(s.share_amount || s.amount).toFixed(2)}
            </span>
          ))}
        </div>
      )}
      {/* Edit/Delete Actions */}
      {isCreator && (
        <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2 justify-end">
          <button
            onClick={() => onEdit?.(expense)}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-medium transition"
          >
            <Pencil size={14} className="inline mr-1" /> {t('edit')}
          </button>
          <button
            onClick={() => {
              if (window.confirm(t('confirm_delete_expense'))) {
                onDelete?.(expense.id);
              }
            }}
            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-3.5 py-1.5 rounded-lg font-medium transition"
          >
            <Trash2 size={14} className="inline mr-1" /> {t('delete')}
          </button>
        </div>
      )}
    </div>
  );
}
