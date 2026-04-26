import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import api from '../api';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Home, Receipt, DollarSign } from 'lucide-react';

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

  // Inline validation states
  const [touched, setTouched] = React.useState({});

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

  const getFieldError = (field) => {
    if (!touched[field]) return '';
    if (field === 'description' && !description.trim()) return t('error_description_required');
    if (field === 'amount' && (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) return t('error_invalid_amount');
    if (field === 'splitType' && !splitType) return t('error_select_split_type');
    return '';
  };

  const markTouched = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Inline validation before submit
    setTouched({ description: true, amount: true, splitType: true });

    if (!description.trim()) {
      setError(t('error_description_required'));
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError(t('error_invalid_amount'));
      return;
    }
    if (!splitType) {
      setError(t('error_select_split_type'));
      return;
    }

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
      toast.success(t('toast_expense_added'));
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
      navigate(`/group/${groupId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create expense');
      toast.error(t('toast_error_generic'));
    }
    setLoading(false);
  };

  const updateSplit = (index, value) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], value };
    setSplits(newSplits);
  };

  const descriptionError = getFieldError('description');
  const amountError = getFieldError('amount');

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />
      <PageTransition>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(`/group/${groupId}`)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-700 text-2xl font-semibold focus-ring rounded-lg"
            aria-label={t('cancel')}
            title={t('cancel')}
          >
            <ArrowLeft size={24} />
          </button>
          <button
            onClick={() => navigate('/')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 text-2xl focus-ring rounded-lg"
            aria-label="Home"
            title="Home"
          >
            <Home size={24} />
          </button>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          <Receipt size={28} className="inline mr-2" aria-hidden="true" /> {t('add_expense')}
        </h2>

        <form onSubmit={handleSubmit} autoComplete="off" className="mt-6 space-y-4">
          {error && (
            <div role="alert" className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="expense-description" className="block text-sm font-medium text-slate-700 mb-1">
              {t('description')}
            </label>
            <input
              id="expense-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => markTouched('description')}
              placeholder="Dinner, Groceries, etc."
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none focus-ring ${
                descriptionError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'
              }`}
              required
            />
            {descriptionError && (
              <p className="text-xs text-rose-500 mt-1" role="alert">{descriptionError}</p>
            )}
          </div>

          <div>
            <label htmlFor="expense-amount" className="block text-sm font-medium text-slate-700 mb-1">
              {t('amount')} (MXN)
              {splitType === 'exact' && (
                <span className="text-xs text-slate-400 ml-1 font-normal">
                  (auto-calculated from splits)
                </span>
              )}
            </label>
            <input
              id="expense-amount"
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
                markTouched('amount');
                if (!amount && splitType === 'exact') {
                  setManualAmount(false);
                }
              }}
              placeholder="0.00"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none focus-ring ${
                amountError ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'
              } ${splitType === 'exact' && !manualAmount ? 'bg-slate-50' : ''}`}
              required
            />
            {amountError && (
              <p className="text-xs text-rose-500 mt-1" role="alert">{amountError}</p>
            )}
            {splitType === 'exact' && (
              <p className="text-xs text-slate-500 mt-1">
                Sum of splits: <span className={Math.abs(splitTotal - parseFloat(amount || 0)) > 0.01 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  MX${splitTotal.toFixed(2)}
                </span>
                {Math.abs(splitTotal - parseFloat(amount || 0)) > 0.01 && (
                  <span className="text-rose-500 ml-1">Does not match total</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="expense-paid-by" className="block text-sm font-medium text-slate-700 mb-1">
              {t('paid_by')}
            </label>
            <select
              id="expense-paid-by"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none focus-ring"
              required
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span id="split-type-label" className="block text-sm font-medium text-slate-700 mb-1">
              {t('split_type')}
            </span>
            <div className="flex gap-2" role="radiogroup" aria-labelledby="split-type-label">
              {['equal', 'percentage', 'exact'].map(type => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={splitType === type}
                  onClick={() => setSplitType(type)}
                  className={`flex-1 min-h-[44px] py-2 px-3 rounded-lg text-sm font-medium border transition focus-ring ${
                    splitType === type
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {t(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Equal split info */}
          {splitType === 'equal' && perPerson && (
            <div className="bg-indigo-50 rounded-lg p-3 text-sm">
              <span className="text-indigo-700 font-medium">{t('per_person')}: ${perPerson}</span>
            </div>
          )}

          {/* Custom splits */}
          {splitType !== 'equal' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                {splitType === 'exact' ? "Enter each person's share:" : t('splits')}
              </p>
              {splits.map((s, i) => (
                <div key={s.userId} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-24">{s.name || members.find(m => m.id === s.userId)?.name}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={s.value}
                    onChange={(e) => updateSplit(i, e.target.value)}
                    placeholder={splitType === 'percentage' ? '%' : 'MX$'}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm focus-ring"
                  />
                </div>
              ))}
              {splitType === 'percentage' && (
                <p className="text-xs mt-1">
                  Total: <span className={Math.abs(splitTotal - 100) > 0.1 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {splitTotal.toFixed(1)}%
                  </span>
                  {Math.abs(splitTotal - 100) > 0.1 && (
                    <span className="text-rose-500 ml-1">Must equal 100%</span>
                  )}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 font-medium disabled:opacity-50 focus-ring"
          >
            {loading ? 'Saving...' : t('save')}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/group/${groupId}`)}
            className="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-4 py-2.5 font-medium focus-ring"
          >
            {t('cancel')}
          </button>
        </form>
      </div>
      </PageTransition>
    </div>
  );
}
