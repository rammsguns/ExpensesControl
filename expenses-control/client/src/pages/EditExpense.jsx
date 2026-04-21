import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';

export default function EditExpense() {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/groups/${groupId}`).then(r => r.data),
  });

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => api.get(`/expenses/${expenseId}`).then(r => r.data),
  });

  const members = group?.members || [];

  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [paidBy, setPaidBy] = React.useState('');
  const [splitType, setSplitType] = React.useState('equal');
  const [splits, setSplits] = React.useState([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  // Track if amount was manually set (for exact mode auto-calculation)
  const [manualAmount, setManualAmount] = React.useState(false);

  // Populate form when expense loads
  React.useEffect(() => {
    if (expense) {
      setDescription(expense.description || '');
      setAmount(expense.amount?.toString() || '');
      setPaidBy(expense.paid_by?.toString() || '');
      setSplitType(expense.split_type || 'equal');
    }
  }, [expense]);

  // Auto-calculate total amount for exact splits
  React.useEffect(() => {
    if (splitType === 'exact' && !manualAmount) {
      const total = splits.reduce((sum, s) => {
        const val = parseFloat(s.value);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
      if (total > 0) {
        setAmount(total.toFixed(2));
      }
    }
  }, [splits, splitType, manualAmount]);

  // Calculate split total for display
  const splitTotal = splits.reduce((sum, s) => {
    const val = parseFloat(s.value);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Initialize splits when splitType or members change
  React.useEffect(() => {
    if (!expense || members.length === 0) return;

    if (splitType === 'equal') {
      setSplits(members.map(m => ({ userId: m.id, value: '' })));
    } else {
      // Pre-fill with existing splits if available
      const existingSplits = expense.splits || [];
      setSplits(members.map(m => {
        const existing = existingSplits.find(s => s.id === m.id || s.user_id === m.id);
        let value = '';
        if (existing) {
          if (splitType === 'percentage') value = ((existing.share_amount || existing.amount) / expense.amount * 100).toFixed(0);
          else if (splitType === 'exact') value = (existing.share_amount || existing.amount).toString();
          else if (splitType === 'shares') value = '1';
        }
        return { userId: m.id, name: m.name, value };
      }));
    }
  }, [members, splitType, expense]);

  const perPerson = amount && members.length > 0 && splitType === 'equal'
    ? (parseFloat(amount) / members.length).toFixed(2)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate exact splits match total
    if (splitType === 'exact') {
      const parsedAmount = parseFloat(amount);
      if (Math.abs(splitTotal - parsedAmount) > 0.01) {
        setError(`Split amounts must total MX$${parsedAmount.toFixed(2)}. Current total: MX$${splitTotal.toFixed(2)}`);
        return;
      }
    }

    // Validate percentage splits sum to 100%
    if (splitType === 'percentage') {
      const totalPct = splits.reduce((sum, s) => {
        const val = parseFloat(s.value);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
      if (Math.abs(totalPct - 100) > 0.1) {
        setError(`Percentages must sum to 100%. Current total: ${totalPct.toFixed(1)}%`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        description,
        amount: parseFloat(amount),
        paidBy: parseInt(paidBy),
        splitType,
        splits: splits.map(s => {
          const base = { userId: s.userId };
          if (splitType === 'percentage') return { ...base, percentage: parseFloat(s.value) };
          if (splitType === 'exact') return { ...base, amount: parseFloat(s.value) };
          if (splitType === 'shares') return { ...base, shares: parseFloat(s.value) };
          return base;
        }).filter(s => s.userId),
      };

      await api.put(`/expenses/${expenseId}`, payload);
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
      qc.invalidateQueries({ queryKey: ['expense', expenseId] });
      navigate(`/group/${groupId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update expense');
    }
    setLoading(false);
  };

  if (isLoading) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>);

  if (!expense) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Expense not found</p></div>);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">✏️ {t('edit_expense')}</h2>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('amount')} (MX$)
              {splitType === 'exact' && (
                <span className="text-xs text-gray-400 ml-1 font-normal">
                  (auto-calculated from splits)
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (splitType === 'exact') {
                  setManualAmount(true);
                }
              }}
              onBlur={() => {
                if (!amount && splitType === 'exact') {
                  setManualAmount(false);
                }
              }}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none ${
                splitType === 'exact' && !manualAmount ? 'bg-gray-50' : ''
              }`}
              required
            />
            {splitType === 'exact' && (
              <p className="text-xs text-gray-500 mt-1">
                Sum of splits: <span className={Math.abs(splitTotal - parseFloat(amount || 0)) > 0.01 ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
                  MX${splitTotal.toFixed(2)}
                </span>
                {Math.abs(splitTotal - parseFloat(amount || 0)) > 0.01 && (
                  <span className="text-red-500 ml-1">⚠️ Does not match total</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('paid_by')}</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} {m.id === user?.id ? '(You)' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('split_type')}</label>
            <div className="grid grid-cols-2 gap-2">
              {['equal', 'percentage', 'exact'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                    splitType === type
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t(type)}
                </button>
              ))}
            </div>
          </div>

          {splitType === 'equal' && perPerson && (
            <p className="text-sm text-gray-500">{perPerson} {t('per_person')}</p>
          )}

          {splitType !== 'equal' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{t('splits')}</p>
              {splits.map((s, i) => (
                <div key={s.userId} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-24 truncate">{s.name || `User ${s.userId}`}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={
                      splitType === 'percentage' ? '%' : 'MX$'
                    }
                    value={s.value}
                    onChange={(e) => {
                      const newSplits = [...splits];
                      newSplits[i].value = e.target.value;
                      setSplits(newSplits);
                    }}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              ))}
              {splitType === 'percentage' && (
                <p className="text-xs mt-1">
                  Total: <span className={Math.abs(splitTotal - 100) > 0.1 ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
                    {splitTotal.toFixed(1)}%
                  </span>
                  {Math.abs(splitTotal - 100) > 0.1 && (
                    <span className="text-red-500 ml-1">⚠️ Must equal 100%</span>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2.5 font-medium disabled:opacity-50"
            >
              {loading ? '...' : t('save')}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2.5 font-medium"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
