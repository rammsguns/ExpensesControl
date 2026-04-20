import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

const GROUP_TYPES = [
  { id: 'home', emoji: '🏠', labelEn: 'Home', labelEs: 'Hogar' },
  { id: 'trip', emoji: '✈️', labelEs: 'Viaje', labelEn: 'Trip' },
  { id: 'couple', emoji: '💑', labelEs: 'Pareja', labelEn: 'Couple' },
  { id: 'other', emoji: '📋', labelEs: 'Otro', labelEn: 'Other' },
];

export default function Dashboard() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then(r => r.data),
  });

  const { data: balances = [] } = useQuery({
    queryKey: ['balances'],
    queryFn: () => api.get('/balances').then(r => r.data),
  });

  // Fetch all friends from existing groups for quick-add
  const { data: existingFriends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('/groups/friends/all').then(r => r.data),
  });

  // Create group state
  const [showCreate, setShowCreate] = React.useState(false);
  const [groupName, setGroupName] = React.useState('');
  const [groupDesc, setGroupDesc] = React.useState('');
  const [groupType, setGroupType] = React.useState('home');
  const [memberEmail, setMemberEmail] = React.useState('');
  const [memberList, setMemberList] = React.useState([]);
  const [memberError, setMemberError] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const addMember = async () => {
    setMemberError('');
    if (!memberEmail.trim()) return;
    if (memberList.some(m => m.email === memberEmail.trim())) {
      setMemberError(language === 'es' ? 'Ya fue agregado' : 'Already added');
      return;
    }
    if (memberEmail.trim() === user?.email) {
      setMemberError(language === 'es' ? 'Eres tú — se agrega automáticamente' : "That's you — added automatically");
      return;
    }
    setMemberList(prev => [...prev, { email: memberEmail.trim(), name: memberEmail.trim().split('@')[0] }]);
    setMemberEmail('');
  };

  const removeMember = (email) => {
    setMemberList(prev => prev.filter(m => m.email !== email));
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/groups', { name: groupName, description: groupDesc, type: groupType });
      const groupId = res.data.id;
      for (const member of memberList) {
        try { await api.post(`/groups/${groupId}/members`, { email: member.email }); } catch {}
      }
      setShowCreate(false);
      setGroupName(''); setGroupDesc(''); setGroupType('home');
      setMemberList([]); setMemberEmail('');
      qc.invalidateQueries({ queryKey: ['groups'] });
      navigate(`/group/${groupId}`);
    } catch (err) {
      console.error('Failed to create group:', err);
    }
    setCreating(false);
  };

  const userBalance = balances.find(b => b.userId === user?.id);
  const getGroupEmoji = (type) => GROUP_TYPES.find(g => g.id === type)?.emoji || '📋';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Total Balance */}
        <div className="mt-2 bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm">{t('total_balance')}</h3>
          {userBalance && (
            <div className={`text-3xl font-bold ${userBalance.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              MX$ {Math.abs(userBalance.balance).toFixed(2)}
              <span className="text-sm font-normal ml-2">
                {userBalance.balance >= 0 ? t('owes_you') : t('you_owe')}
              </span>
            </div>
          )}
        </div>

        {/* Groups */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 text-lg mb-3">
            {language === 'es' ? 'Grupos' : 'Groups'}
          </h3>

          {groupsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm border p-4 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-5xl mb-3">🏠</p>
              <p className="text-gray-500">{t('create_first_group')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(g => (
                <GroupCard key={g.id} group={g} emoji={getGroupEmoji(g.type)} userId={user?.id} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB - Create Group */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed right-4 bottom-24 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-30 active:scale-95 transition"
      >
        +
      </button>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center rounded-t-2xl">
              <button onClick={() => { setShowCreate(false); setMemberList([]); }} className="text-gray-500 font-medium">
                {t('cancel')}
              </button>
              <h3 className="font-bold text-gray-800">{t('create_group')}</h3>
              <button onClick={createGroup} disabled={creating || !groupName.trim()} className="text-emerald-600 font-bold disabled:opacity-40">
                {creating ? '...' : t('save')}
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Group Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Tipo de grupo' : 'Group type'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GROUP_TYPES.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setGroupType(type.id)}
                      className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition ${
                        groupType === type.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-2xl mb-1">{type.emoji}</span>
                      <span className="text-xs font-medium text-gray-700">
                        {language === 'es' ? type.labelEs : type.labelEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('group_name')}</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={language === 'es' ? 'Ej: Casa volcanes credito' : 'e.g. House expenses'}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                <input
                  type="text"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder={language === 'es' ? 'Descripción opcional' : 'Optional description'}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'es' ? 'Agregar miembros' : 'Add members'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => { setMemberEmail(e.target.value); setMemberError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember(); }}}
                    placeholder={language === 'es' ? 'correo@ejemplo.com' : 'email@example.com'}
                    className="flex-1 border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-base"
                  />
                  <button type="button" onClick={addMember} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2.5 font-medium text-sm flex-shrink-0">
                    +
                  </button>
                </div>
                {memberError && <p className="text-red-500 text-xs mt-1">{memberError}</p>}
              </div>

              {/* Quick-add from existing friends */}
              {existingFriends.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'es' ? 'Amigos recientes' : 'Recent friends'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {existingFriends
                      .filter(f => !memberList.some(m => m.email === f.email))
                      .map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setMemberList(prev => [...prev, { email: f.email, name: f.name }])}
                          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-3 py-1.5 transition active:scale-95"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-[10px]">
                            {f.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-emerald-800">{f.name}</span>
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Already added members */}
              {memberList.length > 0 && (
                <div className="space-y-2">
                  {memberList.map(m => (
                    <div key={m.email} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-800">{m.name}</span>
                        <span className="text-xs text-gray-400">{m.email}</span>
                      </div>
                      <button onClick={() => removeMember(m.email)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-800">{user?.name}</span>
                <span className="text-xs text-emerald-600 ml-auto">
                  {language === 'es' ? '(tú — agregado automáticamente)' : '(you — added automatically)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

// Group card with balance — uses its own query per group
function GroupCard({ group, emoji, userId }) {
  const { language } = useTranslation();

  const { data: balances = [] } = useQuery({
    queryKey: ['balances', group.id],
    queryFn: () => api.get(`/balances/group/${group.id}`).then(r => r.data),
  });

  const myBalance = balances.find(b => b.userId === userId);
  const balanceAmount = myBalance ? myBalance.balance : 0;

  return (
    <Link
      to={`/group/${group.id}`}
      className="block bg-white rounded-xl shadow-sm border p-4 hover:border-emerald-300 transition active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-xl flex-shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 truncate">{group.name}</h4>
          {group.description && <p className="text-sm text-gray-500 truncate">{group.description}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          {Math.abs(balanceAmount) > 0.01 ? (
            <span className={`font-bold text-sm ${balanceAmount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {balanceAmount > 0 ? '+' : '-'}MX$ {Math.abs(balanceAmount).toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              {language === 'es' ? 'Saldado ✓' : 'Settled ✓'}
            </span>
          )}
        </div>
        <span className="text-gray-300 text-xl ml-1">›</span>
      </div>
    </Link>
  );
}