import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Receipt, Search, Users } from 'lucide-react';
import { useTranslation } from '../i18n';

/**
 * Reusable empty state component with clear icons, messages, and actionable CTAs.
 * Follows Material Design 3 + Apple HIG guidelines for empty states.
 */

const iconWrapperBase = "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4";
const containerBase = "bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10 text-center";
const headingBase = "text-base font-semibold text-slate-900 mb-2 leading-snug";
const messageBase = "text-sm text-slate-500 mb-5 leading-relaxed";
const actionBase = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl px-5 py-3 font-medium text-sm transition-all duration-150 ease-in-out active:scale-95 focus-ring";

export function EmptyGroups({ onCreateGroup }) {
  const { t } = useTranslation();
  return (
    <div className={containerBase} role="status" aria-live="polite">
      <div className={`${iconWrapperBase} bg-indigo-50`}>
        <Users size={32} className="text-indigo-600" aria-hidden="true" />
      </div>
      <p className={headingBase}>{typeof t === 'function' ? t('create_first_group') : 'Create your first group'}</p>
      <p className={messageBase}>Start organizing expenses with friends.</p>
      <button
        onClick={onCreateGroup}
        className={actionBase}
      >
        <PlusCircle size={18} aria-hidden="true" /> {typeof t === 'function' ? t('create_group') : 'Create Group'}
      </button>
    </div>
  );
}

export function EmptyExpenses({ groupId }) {
  const { t } = useTranslation();
  return (
    <div className={containerBase} role="status" aria-live="polite">
      <div className={`${iconWrapperBase} bg-indigo-50`}>
        <Receipt size={32} className="text-indigo-600" aria-hidden="true" />
      </div>
      <p className={headingBase}>{typeof t === 'function' ? t('no_expenses') : 'No expenses yet'}</p>
      <p className={messageBase}>Add your first expense to start tracking.</p>
      <Link
        to={`/add-expense/${groupId}`}
        className={actionBase}
      >
        <PlusCircle size={18} aria-hidden="true" /> {typeof t === 'function' ? t('add_first_expense') : 'Add Expense'}
      </Link>
    </div>
  );
}

export function EmptySearchResults() {
  const { t } = useTranslation();
  return (
    <div className={containerBase} role="status" aria-live="polite">
      <div className={`${iconWrapperBase} bg-slate-100`}>
        <Search size={32} className="text-slate-500" aria-hidden="true" />
      </div>
      <p className={headingBase}>{typeof t === 'function' ? t('no_search_results') : 'No results found'}</p>
      <p className={messageBase}>Try adjusting your search or filters.</p>
    </div>
  );
}

export function EmptyState({ type, groupId, onCreateGroup }) {
  const { t } = useTranslation();

  const configs = {
    groups: {
      icon: Users,
      wrapperBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      message: typeof t === 'function' ? t('create_first_group') : 'Create your first group',
      actionLabel: typeof t === 'function' ? t('create_group') : 'Create Group',
      onAction: onCreateGroup,
    },
    expenses: {
      icon: Receipt,
      wrapperBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      message: typeof t === 'function' ? t('no_expenses') : 'No expenses yet',
      actionLabel: typeof t === 'function' ? t('add_first_expense') : 'Add Expense',
      onAction: groupId ? () => window.location.href = `/add-expense/${groupId}` : null,
    },
    search: {
      icon: Search,
      wrapperBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      message: typeof t === 'function' ? t('no_search_results') : 'No results found',
    },
  };

  const config = configs[type] || configs.search;
  const Icon = config.icon;

  return (
    <div className={containerBase} role="status" aria-live="polite">
      <div className={`${iconWrapperBase} ${config.wrapperBg}`}>
        <Icon size={32} className={config.iconColor} aria-hidden="true" />
      </div>
      <p className={headingBase}>{config.message}</p>
      {config.onAction && config.actionLabel && (
        <button
          onClick={config.onAction}
          className={actionBase}
        >
          <PlusCircle size={18} aria-hidden="true" /> {config.actionLabel}
        </button>
      )}
    </div>
  );
}
