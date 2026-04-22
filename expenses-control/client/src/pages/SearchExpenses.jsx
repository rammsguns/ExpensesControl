import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

// Wrapper to avoid duplicate useQuery in React Refresh signature
function useGroupsQuery() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then(r => r.data),
  });
}

function useSearchQuery(searchParams) {
  return useQuery({
    queryKey: ['expenses-search', searchParams],
    queryFn: () => api.get(`/expenses/search?${searchParams}`).then(r => r.data),
    enabled: searchParams.length > 0,
  });
}

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

export default function SearchExpenses() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user } = useAuth();

  const [query, setQuery] = React.useState('');
  const [groupId, setGroupId] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [minAmount, setMinAmount] = React.useState('');
  const [maxAmount, setMaxAmount] = React.useState('');
  const [splitType, setSplitType] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  // Fetch user's groups for the filter dropdown
  const groupsQuery = useGroupsQuery();
  const groups = groupsQuery.data || [];

  // Build search params
  const searchParams = React.useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query.trim());
    if (groupId) params.append('groupId', groupId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (minAmount) params.append('minAmount', minAmount);
    if (maxAmount) params.append('maxAmount', maxAmount);
    if (splitType) params.append('splitType', splitType);
    return params.toString();
  }, [query, groupId, startDate, endDate, minAmount, maxAmount, splitType]);

  const resultsQuery = useSearchQuery(searchParams);
  const results = resultsQuery.data || [];
  const isLoading = resultsQuery.isLoading;

  const monthlyResults = groupByMonth(results);

  const hasActiveFilters = groupId || startDate || endDate || minAmount || maxAmount || splitType;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-2xl font-semibold">
            ←
          </button>
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-xl" title="Home">🏠</button>
          <h2 className="text-xl font-bold text-gray-800">🔍 {language === 'es' ? 'Buscar Gastos' : 'Search Expenses'}</h2>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-3 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'es' ? 'Buscar gastos...' : 'Search expenses...'}
              className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                showFilters || hasActiveFilters
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              ⚙️ {language === 'es' ? 'Filtros' : 'Filters'}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{language === 'es' ? 'Grupo' : 'Group'}</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">{language === 'es' ? 'Todos los grupos' : 'All groups'}</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{language === 'es' ? 'Desde' : 'From'}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{language === 'es' ? 'Hasta' : 'To'}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{language === 'es' ? 'Min MX$' : 'Min MX$'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{language === 'es' ? 'Max MX$' : 'Max MX$'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="∞"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('split_type')}</label>
                <select
                  value={splitType}
                  onChange={(e) => setSplitType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">{language === 'es' ? 'Cualquier tipo' : 'Any type'}</option>
                  <option value="equal">{t('equal')}</option>
                  <option value="percentage">{t('percentage')}</option>
                  <option value="exact">{t('exact')}</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setGroupId('');
                    setStartDate('');
                    setEndDate('');
                    setMinAmount('');
                    setMaxAmount('');
                    setSplitType('');
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm font-medium transition"
                >
                  {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        {searchParams.length > 0 && (
          <p className="text-sm text-gray-500 mb-2">
            {results.length} {language === 'es' ? 'resultados' : 'results'}
          </p>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">{language === 'es' ? 'Buscando...' : 'Searching...'}</p>
          </div>
        ) : searchParams.length > 0 && results.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-gray-500">{language === 'es' ? 'No se encontraron gastos' : 'No expenses found'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(monthlyResults).map(([month, exps]) => (
              <div key={month}>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">{month}</h3>
                <div className="space-y-2">
                  {exps.map(exp => {
                    const cat = guessCategory(exp.description);
                    const icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS.other;
                    const isPayer = exp.paid_by === user?.id;
                    const mySplit = exp.splits?.find(s => s.id === user?.id);
                    const myShare = mySplit ? parseFloat(mySplit.share_amount || mySplit.amount) : 0;
                    const netAmount = isPayer ? (parseFloat(exp.amount) - myShare) : -myShare;

                    return (
                      <div
                        key={exp.id}
                        onClick={() => navigate(`/group/${exp.group_id}`)}
                        className="bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition"
                      >
                        <div className={"w-10 h-10 rounded-lg " + icon.bg + " flex items-center justify-center text-lg flex-shrink-0"}>
                          {icon.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{exp.description}</p>
                          <p className="text-xs text-gray-500">
                            {exp.group_name} • {isPayer ? (language === 'es' ? 'Tú pagaste' : 'You paid') : `${exp.paid_by_name || 'Someone'} ${language === 'es' ? 'pagó' : 'paid'}`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-800">MX$ {parseFloat(exp.amount).toFixed(2)}</p>
                          {netAmount > 0.01 ? (
                            <p className="text-xs text-emerald-600">+MX$ {netAmount.toFixed(2)}</p>
                          ) : netAmount < -0.01 ? (
                            <p className="text-xs text-red-500">-MX$ {Math.abs(netAmount).toFixed(2)}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
