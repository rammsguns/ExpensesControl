import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { Receipt, Handshake, Clock } from 'lucide-react';

export default function Activity() {
  const { language } = useTranslation();
  const { user } = useAuth();

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then(r => r.data),
  });

  // Fetch recent expenses and settlements across all groups
  const { data: activity = [], isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: async () => {
      const items = [];
      for (const group of groups) {
        try {
          const expenses = await api.get(`/expenses/group/${group.id}`).then(r => r.data);
          expenses.forEach(e => items.push({ ...e, groupName: group.name, type: 'expense' }));

          const settlements = await api.get(`/settlements/group/${group.id}`).then(r => r.data);
          settlements.forEach(s => items.push({ ...s, groupName: group.name, type: 'settlement' }));
        } catch {}
      }
      // Sort by date desc
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return items;
    },
    enabled: groups.length > 0,
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {language === 'es' ? 'Actividad' : 'Activity'}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mt-8">
            <Clock size={48} className="text-slate-300 mb-3" />
            <p className="text-slate-500">
              {language === 'es' ? 'Sin actividad aún' : 'No activity yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    item.type === 'expense' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {item.type === 'expense' ? <Receipt size={20} /> : <Handshake size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {item.type === 'expense' ? item.description : `${item.from_name} → ${item.to_name}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.groupName} • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`font-bold text-sm ${
                    item.type === 'expense' ? 'text-slate-900' : 'text-emerald-600'
                  }`}>
                    MX$ {parseFloat(item.amount).toFixed(2)}
                  </span>
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
