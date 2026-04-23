import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Receipt, Search, Users, Home } from 'lucide-react';
import { useTranslation } from '../i18n';

/**
 * Improved empty state component with large icons and CTAs.
 */
export function EmptyGroups({ onCreateGroup }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
        <Users size={40} className="text-indigo-600" />
      </div>
      <p className="text-slate-600 mb-4">{t('create_first_group')}</p>
      <button
        onClick={onCreateGroup}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 font-medium text-sm transition active:scale-95 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 outline-none"
      >
        <PlusCircle size={18} /> {t('create_group')}
      </button>
    </div>
  );
}

export function EmptyExpenses({ groupId }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
        <Receipt size={40} className="text-indigo-600" />
      </div>
      <p className="text-slate-600 mb-4">{t('no_expenses')}</p>
      <Link
        to={`/add-expense/${groupId}`}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 font-medium text-sm transition active:scale-95 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 outline-none"
      >
        <PlusCircle size={18} /> {t('add_first_expense')}
      </Link>
    </div>
  );
}

export function EmptySearchResults() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
        <Search size={40} className="text-indigo-600" />
      </div>
      <p className="text-slate-500">{t('no_search_results')}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, message, actionLabel, onAction }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
        <Icon size={40} className="text-indigo-600" />
      </div>
      <p className="text-slate-600 mb-4">{message}</p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 font-medium text-sm transition active:scale-95 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 outline-none"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}