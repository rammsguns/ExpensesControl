import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import PageTransition from '../components/PageTransition';
import { SkeletonExpenseList } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyStates';
import ExpenseCard from '../components/ExpenseCard';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Handshake, Receipt, Home, Users, CheckCircle, Scale, Plane, Heart, MoreHorizontal, X } from 'lucide-react';

const CATEGORY_ICONS = {
  food: { icon: Receipt, bg: 'bg-pink-100 text-pink-600' },
  transport: { icon: MoreHorizontal, bg: 'bg-blue-100 text-blue-600' },
  shopping: { icon: Receipt, bg: 'bg-emerald-100 text-emerald-600' },
  home: { icon: Home, bg: 'bg-amber-100 text-amber-600' },
  entertainment: { icon: Heart, bg: 'bg-purple-100 text-purple-600' },
  travel: { icon: Plane, bg: 'bg-sky-100 text-sky-600' },
  other: { icon: MoreHorizontal, bg: 'bg-gray-100 text-gray-600' },
};

function groupByMonth(expenses) {
  const groups = {};
  expenses.forEach(exp => {
    const date = new Date(exp.created_at);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    if (!groups[label]) groups[label] = [];
    groups[label].push(exp);
  });
  return groups;
}

export default function GroupDetail() {
  const { id } = useParams();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.get(`/groups/${id}`).then(r => r.data),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', id],
    queryFn: () => api.get(`/expenses/group/${id}`).then(r => r.data),
  });

  const { data: balances = [] } = useQuery({
    queryKey: ['balances', id],
    queryFn: () => api.get(`/balances/group/${id}`).then(r => r.data),
  });

  const [showAddMember, setShowAddMember] = React.useState(false);
  const [memberEmail, setMemberEmail] = React.useState('');
  const [addError, setAddError] = React.useState('');
  const [showBalances, setShowBalances] = React.useState(false);

  const addMember = async (e) => {
    e.preventDefault();
    setAddError('');
    try {
      await api.post(`/groups/${id}/members`, { email: memberEmail });
      setMemberEmail('');
      setShowAddMember(false);
      qc.invalidateQueries({ queryKey: ['group', id] });
      toast.success(language === 'es' ? 'Miembro agregado' : 'Member added');
    } catch (err) {
      setAddError(err.response?.data?.error || (language === 'es' ? 'Error al agregar miembro' : 'Failed to add member'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">
          <SkeletonExpenseList count={3} />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 pb-24">
        <Navbar />
        <div className="text-center">
          <p className="text-slate-500 text-lg">{language === 'es' ? 'Grupo no encontrado' : 'Group not found'}</p>
          <button onClick={() => navigate('/')} className="mt-4 min-h-[44px] text-indigo-600 font-medium focus-ring rounded-lg px-4 py-3">
            {language === 'es' ? 'Volver al inicio' : 'Go home'}
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const myBalance = balances.find(b => b.userId === user?.id);
  const others = balances.filter(b => b.userId !== user?.id);
  const iOwe = others.filter(b => b.balance < -0.01);
  const owedMe = others.filter(b => b.balance > 0.01);

  const monthlyExpenses = groupByMonth(expenses);
  const members = group.members || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />
      <PageTransition>
        <div className="max-w-lg mx-auto">
          {/* Group Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-5 pt-6 pb-8">
            <div className="flex items-center gap-3 mb-3">
              <button 
                onClick={() => navigate('/')} 
                className="min-h-[44px] min-w-[44px] flex items-center gap-1 text-white/80 hover:text-white transition-colors duration-150 rounded-lg focus-ring"
                aria-label={language === 'es' ? 'Volver a grupos' : 'Back to groups'}
              >
                <ArrowLeft size={24} aria-hidden="true" />
              </button>
              <span className="text-sm font-medium text-white/80">
                {language === 'es' ? 'Grupos' : 'Groups'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{group.name}</h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="bg-white/20 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Users size={14} aria-hidden="true" />
                {members.length} {language === 'es' ? 'personas' : 'people'}
              </span>
              <button
                onClick={() => setShowAddMember(true)}
                className="min-h-[44px] bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-full transition-colors duration-150 flex items-center gap-1.5 focus-ring"
              >
                <Plus size={14} aria-hidden="true" />
                {language === 'es' ? 'Agregar' : 'Add'}
              </button>
            </div>
          </div>

          {/* Balance Statement */}
          <div className="bg-white border-b px-5 py-5">
            {iOwe.length === 0 && owedMe.length === 0 ? (
              <p className="text-lg font-semibold text-slate-600 flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-500" aria-hidden="true" />
                {language === 'es' ? 'Todo saldado' : 'All settled up'}
              </p>
            ) : (
              <div className="space-y-2">
                {iOwe.map(b => (
                  <p key={b.userId} className="text-base font-semibold text-rose-600 leading-relaxed">
                    {language === 'es' ? 'Debes a' : 'You owe'} {b.name}{' '}
                    <span className="font-bold text-orange-500">MX$ {Math.abs(b.balance).toFixed(2)}</span>
                  </p>
                ))}
                {owedMe.map(b => (
                  <p key={b.userId} className="text-base font-semibold text-slate-900 leading-relaxed">
                    {b.name} {language === 'es' ? 'te debe' : 'owes you'}{' '}
                    <span className="font-bold text-emerald-600">MX$ {b.balance.toFixed(2)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 px-5 py-4 bg-white border-b overflow-x-auto scrollbar-hide">
            <Link
              to={`/settle/${id}`}
              className="min-h-[48px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-2 flex-shrink-0 focus-ring"
            >
              <Handshake size={18} aria-hidden="true" />
              {language === 'es' ? 'Saldar' : 'Settle up'}
            </Link>
            <button
              onClick={() => setShowBalances(!showBalances)}
              aria-expanded={showBalances}
              aria-controls="balances-panel"
              className={`min-h-[48px] rounded-xl px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-2 flex-shrink-0 focus-ring ${
                showBalances 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Scale size={18} aria-hidden="true" />
              {language === 'es' ? 'Saldos' : 'Balances'}
            </button>
            <Link
              to={`/add-expense/${id}`}
              className="min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 rounded-xl px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-2 flex-shrink-0 focus-ring shadow-sm"
            >
              <Receipt size={18} aria-hidden="true" />
              {language === 'es' ? 'Agregar Gasto' : 'Add Expense'}
            </Link>
          </div>

          {/* Balances Panel */}
          {showBalances && (
            <div id="balances-panel" className="bg-white border-b px-5 py-5 space-y-3">
              {balances.map(b => (
                <div key={b.userId} className="flex justify-between items-center py-2">
                  <span className="font-medium text-slate-900 text-sm">
                    {b.userId === user?.id ? (language === 'es' ? 'Tú' : 'You') : b.name}
                  </span>
                  <span className={`font-bold text-base ${
                    b.balance > 0.01 ? 'text-emerald-600' : b.balance < -0.01 ? 'text-rose-600' : 'text-slate-400'
                  }`}>
                    {Math.abs(b.balance) <= 0.01
                      ? (language === 'es' ? 'Saldado' : 'Settled')
                      : b.balance > 0
                        ? `+MX$ ${b.balance.toFixed(2)}`
                        : `-MX$ ${Math.abs(b.balance).toFixed(2)}`
                    }
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Members pills */}
          <div className="bg-slate-50 px-5 py-4 border-b">
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-800">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-900">{m.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses by Month */}
          <div className="px-4 py-6">
            {expenses.length === 0 ? (
              <EmptyState type="expenses" groupId={id} />
            ) : (
              Object.entries(monthlyExpenses).map(([month, exps]) => (
                <div key={month} className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide leading-relaxed">{month}</h3>
                  <div className="space-y-3">
                    {exps.map(exp => (
                      <ExpenseCard
                        key={exp.id}
                        expense={exp}
                        currentUser={user}
                        onEdit={(expense) => navigate(`/edit-expense/${id}/${expense.id}`)}
                        onDelete={async (expenseId) => {
                          try {
                            await api.delete(`/expenses/${expenseId}`);
                            qc.invalidateQueries({ queryKey: ['expenses', id] });
                            qc.invalidateQueries({ queryKey: ['balances', id] });
                            toast.success(typeof t === 'function' ? t('toast_expense_deleted') : 'Expense deleted');
                          } catch (err) {
                            toast.error(err.response?.data?.error || 'Failed to delete expense');
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FAB */}
        <div className="fixed right-4 bottom-28 flex flex-col gap-3 z-30">
          <Link
            to={`/add-expense/${id}`}
            className="min-h-[56px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-full shadow-lg flex items-center gap-2 px-5 py-3 active:scale-95 transition-all duration-150 focus-ring"
            aria-label={language === 'es' ? 'Agregar gasto' : 'Add expense'}
          >
            <Plus size={24} aria-hidden="true" />
            <span className="font-medium text-sm">{language === 'es' ? 'Agregar' : 'Add'}</span>
          </Link>
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 safe-area-bottom">
            <form onSubmit={addMember} className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 space-y-5">
              <h3 className="text-lg font-bold text-slate-900">{language === 'es' ? 'Agregar miembro' : 'Add member'}</h3>
              
              {addError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-start gap-2" role="alert" aria-live="polite">
                  <X size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p>{addError}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="member-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {typeof t === 'function' ? t('member_email') || 'Email' : 'Email'}
                </label>
                <input
                  id="member-email"
                  type="email"
                  value={memberEmail}
                  onChange={(e) => { setMemberEmail(e.target.value); setAddError(''); }}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base min-h-[48px] transition-all duration-150 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 min-h-[48px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl px-4 py-3 font-medium transition-all duration-150 active:scale-[0.97] focus-ring"
                >
                  {typeof t === 'function' ? t('save') : 'Save'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowAddMember(false); setAddError(''); }} 
                  className="flex-1 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-3 font-medium transition-all duration-150 active:scale-[0.97] focus-ring"
                >
                  {typeof t === 'function' ? t('cancel') : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        )}
      </PageTransition>
      <BottomNav />
    </div>
  );
}
