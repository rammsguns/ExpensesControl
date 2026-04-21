import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import api from '../api';
import Navbar from '../components/Navbar';

export default function AddExpense() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/groups/${groupId}`).then(r => r.data),
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

  React.useEffect(() => {
    if (members.length > 0 && !paidBy) {
      setPaidBy(members[0]?.id?.toString() || '');
    }
    if (splitType === 'equal') {
      setSplits(members.map(m => ({ userId: m.id, value: '' })));
    } else {
      setSplits(members.map(m => ({ userId: m.id, name: m.name, value: '' })));
    }
    // Reset manual flag when split type changes
    setManualAmount(false);
  }, [members, splitType]);

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

  const perPerson = amount && members.length > 0 && splitType === 'equal'
    ? (parseFloat(amount) / members.length).toFixed(2)
    : null;

  // Calculate split total for display
  const splitTotal = splits.reduce((sum, s) => {
    const val = parseFloat(s.value);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

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

    setLoading(true);

    try {
      const payload = {
        groupId: parseInt(groupId),
        description,
        amount: parseFloat(amount),
        paidBy: parseInt(paidBy),
        splitType,
        splits: splitType === 'equal' ? [] : splits.map(s => ({
          userId: parseInt(s.userId),
          ...(splitType === 'percentage' ? { percentage: parseFloat(s.value) } : {}),
          ...(splitType === 'exact' ? { amount: parseFloat(s.value) } : {}),
          ...(splitType === 'shares' ? { shares: parseFloat(s.value) } : {}),
        })),
      };
      await api.post('/expenses', payload);
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
      navigate(`/group/${groupId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create expense');
    }
    setLoading(false);
  };

  const updateSplit = (index, value) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], value };
    setSplits(newSplits);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-800">💰 {t('add_expense')}</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dinner, Groceries, etc."
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('amount')} (MXN)
              {splitType === 'exact' && (
                <span className="text-xs text-gray-400 ml-1 font-normal">
                  (auto-calculated from splits)
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (splitType === 'exact') {
                  setManualAmount(true);
                }
              }}
              onBlur={() => {
                // If amount is cleared, allow auto-calculation again
                if (!amount && splitType === 'exact') {
                  setManualAmount(false);
                }
              }}
              placeholder="0.00"
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
              required
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('split_type')}</label>
            <div className="flex gap-2">
              {['equal', 'percentage', 'exact'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${
                    splitType === type
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {t(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Equal split info */}
          {splitType === 'equal' && perPerson && (
            <div className="bg-emerald-50 rounded-lg p-3 text-sm">
              <span className="text-emerald-700 font-medium">{t('per_person')}: ${perPerson}</span>
            </div>
          )}

          {/* Custom splits */}
          {splitType !== 'equal' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {splitType === 'exact' ? 'Enter each person\'s share:' : t('splits')}
              </p>
              {splits.map((s, i) => (
                <div key={s.userId} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-24">{s.name || members.find(m => m.id === s.userId)?.name}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={s.value}
                    onChange={(e) => updateSplit(i, e.target.value)}
                    placeholder={splitType === 'percentage' ? '%' : splitType === 'shares' ? 'shares' : 'MX$'}
                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2.5 font-medium disabled:opacity-50"
          >
            {loading ? '...' : t('save')}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/group/${groupId}`)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2.5 font-medium"
          >
            {t('cancel')}
          </button>
        </form>
      </div>
    </div>
  );
}
