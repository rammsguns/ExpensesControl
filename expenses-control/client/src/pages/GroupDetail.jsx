import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import PageTransition from '../components/PageTransition';
import { SkeletonCard } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyStates';
import ExpenseCard from '../components/ExpenseCard';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Handshake, Search, Receipt, Pencil, Trash2, Home, Users, CheckCircle, Scale, Plane, Heart, MoreHorizontal } from 'lucide-react';

const CATEGORY_ICONS = {
  food: { icon: Receipt, bg: 'bg-pink-100 text-pink-600' },
  transport: { icon: Search, bg: 'bg-blue-100 text-blue-600' },
  shopping: { icon: Receipt, bg: 'bg-emerald-100 text-emerald-600' },
  home: { icon: Home, bg: 'bg-amber-100 text-amber-600' },
  entertainment: { icon: Heart, bg: 'bg-purple-100 text-purple-600' },
  travel: { icon: Plane, bg: 'bg-sky-100 text-sky-600' },
  other: { icon: MoreHorizontal, bg: 'bg-gray-100 text-gray-600' },
};

function guessCategory(description) {
  const d = (description || '').toLowerCase();
  if (/mercado|comal|grocer|super|abarrotes|cerveceria|comida|dinner|lunch|restaur/.test(d)) return 'food';
  if (/gas|gasolina|taxi|uber|gasolinera|fuel/.test(d)) return 'transport';
  if (/hotel|airbnb|hospedaje|casa|remodel|rent/.test(d)) return 'home';
  if (/compra|shop|store|tienda|amazon/.test(d)) return 'shopping';
  if (/viaje|trip|vuelo|ticket/.test(d)) return 'travel';
  if (/fiesta|party|bar|cantina|entreten/.test(d)) return 'entertainment';
  return 'other';
}

function groupByMonth(expenses) {
  const groups = {};
  expenses.forEach(exp => {
    const date = new Date(exp.created_at);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    // Capitalize first letter
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
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add member');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p>Loading...</p></div>;
  if (!group) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p>Group not found</p></div>;

  const myBalance = balances.find(b => b.userId === user?.id);
  const others = balances.filter(b => b.userId !== user?.id);

  // Find who I owe / who owes me the most
  const iOwe = others.filter(b => b.balance < -0.01);
  const owedMe = others.filter(b => b.balance > 0.01);
  const settled = others.filter(b => Math.abs(b.balance) <= 0.01);

  const monthlyExpenses = groupByMonth(expenses);
  const members = group.members || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />
      <PageTransition>
      <div className="max-w-lg mx-auto">
        {/* Group Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-4 pt-5 pb-6 -mt-px">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-white/80 hover:text-white text-2xl font-semibold">
              <ArrowLeft size={24} />
              {language === 'es' ? 'Grupos' : 'Groups'}
            </button>
            <button onClick={() => navigate('/')} className="text-white/60 hover:text-white text-2xl ml-auto" title="Home">
              <Home size={24} />
            </button>
          </div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <div className="flex gap-2 mt-2">
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
              <Users size={14} /> {members.length} {language === 'es' ? 'personas' : 'people'}
            </span>
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-full transition"
            >
              <Plus size={14} /> {language === 'es' ? 'Agregar' : 'Add'}
            </button>
          </div>
        </div>

        {/* Balance Statement */}
        <div className="bg-white border-b px-5 py-5">
          {iOwe.length === 0 && owedMe.length === 0 ? (
            <p className="text-xl font-semibold text-slate-600">
              <CheckCircle size={20} className="inline mr-2" /> {language === 'es' ? 'Todo saldado' : 'All settled up'}
            </p>
          ) : (
            <div className="space-y-2">
              {iOwe.map(b => (
                <p key={b.userId} className="text-lg font-semibold text-rose-600">
                  {language === 'es' ? 'Debes a' : 'You owe'} {b.name} <span className="text-xl font-bold text-orange-500">MX$ {Math.abs(b.balance).toFixed(2)}</span>
                </p>
              ))}
              {owedMe.map(b => (
                <p key={b.userId} className="text-lg font-semibold text-slate-900">
                  {b.name} {language === 'es' ? 'te debe' : 'owes you'} <span className="text-xl font-bold text-emerald-600">MX$ {b.balance.toFixed(2)}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-5 py-4 bg-white border-b overflow-x-auto">
          <Link
            to={`/settle/${id}`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-3 text-base font-medium whitespace-nowrap transition shadow-sm"
          >
            <Handshake size={18} className="inline mr-2" /> {language === 'es' ? 'Saldar' : 'Settle up'}
          </Link>
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-5 py-3 text-base font-medium whitespace-nowrap transition shadow-sm"
          >
            <Scale size={18} className="inline mr-2" /> {language === 'es' ? 'Saldos' : 'Balances'}
          </button>
          <Link
            to={`/add-expense/${id}`}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-5 py-3 text-base font-medium whitespace-nowrap transition shadow-sm"
          >
            <Receipt size={18} className="inline mr-2" /> {language === 'es' ? 'Totales' : 'Totals'}
          </Link>
        </div>

        {/* Balances Panel (toggle) */}
        {showBalances && (
          <div className="bg-white border-b px-5 py-4 space-y-3">
            {balances.map(b => (
              <div key={b.userId} className="flex justify-between items-center">
                <span className="font-semibold text-slate-900 text-base">
                  {b.userId === user?.id ? (language === 'es' ? 'Tú' : 'You') : b.name}
                </span>
                <span className={`font-bold text-lg ${b.balance > 0.01 ? 'text-emerald-600' : b.balance < -0.01 ? 'text-rose-600' : 'text-slate-400'}`}>
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
          <div className="flex flex-wrap gap-3">
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
        <div className="px-4 py-4">
          {expenses.length === 0 ? (
            <EmptyState type="expenses" />
          ) : (
            Object.entries(monthlyExpenses).map(([month, exps]) => (
              <div key={month} className="mb-4">
                <h3 className="text-sm font-semibold text-slate-500 mb-2">{month}</h3>
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
                          toast.success(t('toast_expense_deleted'));
                        } catch (err) {
                          alert(err.response?.data?.error || 'Failed to delete expense');
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

      {/* FABs */}
      <div className="fixed right-4 bottom-24 flex flex-col gap-3 z-30">
        <Link
          to={`/add-expense/${id}`}
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center text-lg font-bold active:scale-95 transition"
        >
          <Plus size={28} />
        </Link>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <form onSubmit={addMember} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">{language === 'es' ? 'Agregar miembro' : 'Add member'}</h3>
            {addError && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm">{addError}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('member_email')}</label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 font-medium">
                {t('save')}
              </button>
              <button type="button" onClick={() => { setShowAddMember(false); setAddError(''); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-4 py-2 font-medium">
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <BottomNav />
      </PageTransition>
    </div>
  );
}
