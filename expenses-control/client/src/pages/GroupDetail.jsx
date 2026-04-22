import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import ExpenseCard from '../components/ExpenseCard';

const CATEGORY_ICONS = {
  food: { emoji: '🍽️', bg: 'bg-pink-100' },
  transport: { emoji: '⛽', bg: 'bg-blue-100' },
  shopping: { emoji: '🛒', bg: 'bg-emerald-100' },
  home: { emoji: '🏠', bg: 'bg-amber-100' },
  entertainment: { emoji: '🎉', bg: 'bg-purple-100' },
  travel: { emoji: '✈️', bg: 'bg-sky-100' },
  other: { emoji: '🧾', bg: 'bg-gray-100' },
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

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>;
  if (!group) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Group not found</p></div>;

  const myBalance = balances.find(b => b.userId === user?.id);
  const others = balances.filter(b => b.userId !== user?.id);

  // Find who I owe / who owes me the most
  const iOwe = others.filter(b => b.balance < -0.01);
  const owedMe = others.filter(b => b.balance > 0.01);
  const settled = others.filter(b => Math.abs(b.balance) <= 0.01);

  const monthlyExpenses = groupByMonth(expenses);
  const members = group.members || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-lg mx-auto">
        {/* Group Header */}
        <div className="bg-emerald-600 text-white px-4 pt-4 pb-6 -mt-px">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-white/80 hover:text-white text-2xl font-semibold">
              ← {language === 'es' ? 'Grupos' : 'Groups'}
            </button>
            <button onClick={() => navigate('/')} className="text-white/60 hover:text-white text-xl ml-auto" title="Home">🏠</button>
          </div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <div className="flex gap-2 mt-2">
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
              👥 {members.length} {language === 'es' ? 'personas' : 'people'}
            </span>
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-full transition"
            >
              + {language === 'es' ? 'Agregar' : 'Add'}
            </button>
          </div>
        </div>

        {/* Balance Statement */}
        <div className="bg-white border-b px-4 py-4">
          {iOwe.length === 0 && owedMe.length === 0 ? (
            <p className="text-lg font-semibold text-gray-600">
              ✅ {language === 'es' ? 'Todo saldado' : 'All settled up'}
            </p>
          ) : (
            <div className="space-y-1">
              {iOwe.map(b => (
                <p key={b.userId} className="text-lg font-semibold text-red-500">
                  {language === 'es' ? 'Debes a' : 'You owe'} {b.name} <span className="text-orange-500 font-bold">MX$ {Math.abs(b.balance).toFixed(2)}</span>
                </p>
              ))}
              {owedMe.map(b => (
                <p key={b.userId} className="text-lg font-semibold text-gray-800">
                  {b.name} {language === 'es' ? 'te debe' : 'owes you'} <span className="text-emerald-600 font-bold">MX$ {b.balance.toFixed(2)}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 px-4 py-3 bg-white border-b overflow-x-auto">
          <Link
            to={`/settle/${id}`}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition"
          >
            🤝 {language === 'es' ? 'Saldar' : 'Settle up'}
          </Link>
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition"
          >
            ⚖️ {language === 'es' ? 'Saldos' : 'Balances'}
          </button>
          <Link
            to={`/add-expense/${id}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition"
          >
            💰 {language === 'es' ? 'Totales' : 'Totals'}
          </Link>
        </div>

        {/* Balances Panel (toggle) */}
        {showBalances && (
          <div className="bg-white border-b px-4 py-3 space-y-2">
            {balances.map(b => (
              <div key={b.userId} className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-800">
                  {b.userId === user?.id ? (language === 'es' ? 'Tú' : 'You') : b.name}
                </span>
                <span className={`font-bold ${b.balance > 0.01 ? 'text-emerald-600' : b.balance < -0.01 ? 'text-red-500' : 'text-gray-400'}`}>
                  {Math.abs(b.balance) <= 0.01
                    ? (language === 'es' ? 'Saldado ✓' : 'Settled ✓')
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
        <div className="bg-gray-50 px-4 py-3 border-b">
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-gray-700">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses by Month */}
        <div className="px-4 py-4">
          {expenses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-4xl mb-2">🧾</p>
              <p className="text-gray-500">{t('no_expenses')}</p>
            </div>
          ) : (
            Object.entries(monthlyExpenses).map(([month, exps]) => (
              <div key={month} className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">{month}</h3>
                <div className="space-y-2">
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
          className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center text-lg font-bold active:scale-95 transition"
        >
          +
        </Link>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <form onSubmit={addMember} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">{language === 'es' ? 'Agregar miembro' : 'Add member'}</h3>
            {addError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{addError}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('member_email')}</label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 font-medium">
                {t('save')}
              </button>
              <button type="button" onClick={() => { setShowAddMember(false); setAddError(''); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 font-medium">
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <BottomNav />
    </div>
  );
}