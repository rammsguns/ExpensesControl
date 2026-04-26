import React from 'react';
import { useTranslation } from '../i18n';
import { Pencil, Trash2 } from 'lucide-react';

export default function ExpenseCard({ expense, currentUser, onEdit, onDelete }) {
  const { t } = useTranslation();

  const date = expense.date
    ? new Date(expense.date).toLocaleDateString()
    : '';

  const splitLabels = {
    equal: typeof t === 'function' ? t('equal') : 'Equal',
    percentage: typeof t === 'function' ? t('percentage') : 'Percentage',
    exact: typeof t === 'function' ? t('exact') : 'Exact',
    shares: typeof t === 'function' ? t('shares') : 'Shares',
  };

  const isCreator = expense.paid_by === currentUser?.id;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 hover:shadow-md transition-shadow duration-200 ease-in-out">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate text-base leading-snug">{expense.description}</h4>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            {expense.paid_by_name || `User ${expense.paid_by}`} • {date}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xl font-bold text-slate-900 leading-tight">
            ${parseFloat(expense.amount).toFixed(2)}
          </span>
          <span className="block text-xs text-slate-400 mt-1 leading-relaxed">
            {splitLabels[expense.split_type] || expense.split_type}
          </span>
        </div>
      </div>

      {/* Splits */}
      {expense.splits && expense.splits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          {expense.splits.map((s, i) => (
            <span
              key={i}
              className={`text-xs font-medium px-3 py-1.5 rounded-full leading-relaxed ${
                s.id === currentUser?.id 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-slate-50 text-slate-600'
              }`}
            >
              {s.name}: ${parseFloat(s.share_amount || s.amount).toFixed(2)}
            </span>
          ))}
        </div>
      )}

      {/* Edit/Delete Actions */}
      {isCreator && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 justify-end">
          <button
            onClick={() => onEdit?.(expense)}
            className="min-h-[36px] inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors duration-150 focus-ring"
            aria-label={`${typeof t === 'function' ? t('edit') : 'Edit'} ${expense.description}`}
          >
            <Pencil size={14} aria-hidden="true" />
            <span>{typeof t === 'function' ? t('edit') : 'Edit'}</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm(typeof t === 'function' ? t('confirm_delete_expense') : 'Delete this expense?')) {
                onDelete?.(expense.id);
              }
            }}
            className="min-h-[36px] inline-flex items-center gap-1.5 text-xs bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 px-4 py-2 rounded-lg font-medium transition-colors duration-150 focus-ring"
            aria-label={`${typeof t === 'function' ? t('delete') : 'Delete'} ${expense.description}`}
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>{typeof t === 'function' ? t('delete') : 'Delete'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
