import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

export default function Friends() {
  const { t, language } = useTranslation();
  const { user } = useAuth();

  const { data: balances = [] } = useQuery({
    queryKey: ['balances'],
    queryFn: () => api.get('/balances').then(r => r.data),
  });

  const friends = balances.filter(b => b.userId !== user?.id && Math.abs(b.balance) > 0.01);
  const settled = balances.filter(b => b.userId !== user?.id && Math.abs(b.balance) <= 0.01);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {language === 'es' ? 'Amigos' : 'Friends'}
        </h2>

        {friends.length === 0 && settled.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center mt-8">
            <p className="text-5xl mb-3">👥</p>
            <p className="text-gray-500">
              {language === 'es'
                ? 'Agrega gastos a un grupo para ver amigos aquí'
                : 'Add expenses to a group to see friends here'}
            </p>
          </div>
        ) : (
          <>
            {/* Active balances */}
            {friends.length > 0 && (
              <div className="space-y-2">
                {friends.map(f => (
                  <div key={f.userId} className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      f.balance > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{f.name}</p>
                      <p className={`text-sm font-medium ${f.balance > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {f.balance > 0
                          ? (language === 'es' ? `te debe MX$${f.balance.toFixed(2)}` : `owes you MX$${f.balance.toFixed(2)}`)
                          : (language === 'es' ? `debes MX$${Math.abs(f.balance).toFixed(2)}` : `you owe MX$${Math.abs(f.balance).toFixed(2)}`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Settled up friends */}
            {settled.length > 0 && (
              <>
                <p className="text-sm text-gray-400 mt-6 mb-2">
                  {language === 'es' ? 'Saldados' : 'Settled up'}
                </p>
                <div className="space-y-2">
                  {settled.map(f => (
                    <div key={f.userId} className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3 opacity-60">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-500">
                        {f.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-600">{f.name}</p>
                        <p className="text-sm text-gray-400">
                          {language === 'es' ? 'Saldado ✓' : 'Settled up ✓'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}