import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';

export default function SettleUp() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.get(`/groups/${groupId}`).then(r => r.data),
  });

  const { data: balances = [] } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: () => api.get(`/balances/group/${groupId}`).then(r => r.data),
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements', groupId],
    queryFn: () => api.get(`/settlements/group/${groupId}`).then(r => r.data),
  });

  const { data: plan = [] } = useQuery({
    queryKey: ['settlementPlan', groupId],
    queryFn: () => api.get(`/settlements/group/${groupId}/plan`).then(r => r.data),
  });

  const [fromUserId, setFromUserId] = React.useState('');
  const [toUserId, setToUserId] = React.useState('');
  const [settleAmount, setSettleAmount] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const members = group?.members || [];

  const handleSettle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/settlements', {
        groupId: parseInt(groupId),
        fromUserId: parseInt(fromUserId),
        toUserId: parseInt(toUserId),
        amount: parseFloat(settleAmount),
      });
      setFromUserId('');
      setToUserId('');
      setSettleAmount('');
      qc.invalidateQueries({ queryKey: ['settlements', groupId] });
      qc.invalidateQueries({ queryKey: ['settlementPlan', groupId] });
      qc.invalidateQueries({ queryKey: ['balances', groupId] });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record settlement');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(`/group/${groupId}`)} className="text-emerald-600 text-sm">← {t('dashboard')}</button>
        </div>

        <h2 className="text-2xl font-bold text-gray-800">🤝 {t('settle_up')}</h2>

        {/* Simplified Debts */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-700 mb-3">{t('simplified_debts')}</h3>
          {plan.length === 0 ? (
            <p className="text-gray-400 text-center py-4">✅ All settled up!</p>
          ) : (
            <div className="space-y-3">
              {plan.map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <div className="text-sm">
                    <span className="font-medium text-red-600">{p.fromName}</span>
                    <span className="text-gray-500 mx-2">→</span>
                    <span className="font-medium text-emerald-600">{p.toName}</span>
                  </div>
                  <span className="font-bold text-gray-800">${p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Record Settlement */}
        <div className="mt-4 bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-700 mb-3">{t('record_settlement')}</h3>
          <form onSubmit={handleSettle} className="space-y-3">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('from')}</label>
              <select
                value={fromUserId}
                onChange={(e) => setFromUserId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              >
                <option value="">Select...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('to')}</label>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              >
                <option value="">Select...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')} (MXN)</label>
              <input
                type="number"
                step="0.01"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2.5 font-medium disabled:opacity-50"
            >
              {loading ? '...' : t('settle')}
            </button>
          </form>
        </div>

        {/* Settlement History */}
        <div className="mt-4 bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-700 mb-3">{t('settlement_history')}</h3>
          {settlements.length === 0 ? (
            <p className="text-gray-400 text-center py-4">{t('no_settlements')}</p>
          ) : (
            <div className="space-y-2">
              {settlements.map(s => (
                <div key={s.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3 text-sm">
                  <span>
                    <span className="font-medium">{s.from_name || `User ${s.from_user_id}`}</span>
                    <span className="text-gray-400 mx-1">→</span>
                    <span className="font-medium">{s.to_name || `User ${s.to_user_id}`}</span>
                  </span>
                  <span className="font-bold text-emerald-600">${parseFloat(s.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}