import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import PageTransition from '../components/PageTransition';
import { SkeletonGroupGrid } from '../components/SkeletonLoaders';
import { EmptyState } from '../components/EmptyStates';
import { Search, PlusCircle, Users, Handshake, Home, Plus, Plane, Heart, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

const GROUP_TYPES = [
  { id: 'home', icon: Home, labelEn: 'Home', labelEs: 'Hogar' },
  { id: 'trip', icon: Plane, labelEs: 'Viaje', labelEn: 'Trip' },
  { id: 'couple', icon: Heart, labelEs: 'Pareja', labelEn: 'Couple' },
  { id: 'other', icon: MoreHorizontal, labelEs: 'Otro', labelEn: 'Other' },
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
      toast.success(t('group_created'));
      setGroupName(''); setGroupDesc(''); setGroupType('home');
      setMemberList([]); setMemberEmail('');
      qc.invalidateQueries({ queryKey: ['groups'] });
      navigate(`/group/${groupId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || t('error'));
    }
    setCreating(false);
  };

  const userBalance = balances.find(b => b.userId === user?.id);
  const getGroupIcon = (type) => GROUP_TYPES.find(g => g.id === type)?.icon || MoreHorizontal;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />
      <PageTransition>
      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Total Balance */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg p-5 text-white mb-4">
          <h3 className="font-semibold text-indigo-100 mb-2 text-sm">{t('total_balance')}</h3>
          {userBalance && (
            <div className="text-4xl font-bold mb-2">
              MX$ {Math.abs(userBalance.balance).toFixed(2)}
              <span className="text-lg font-normal ml-2">
                {userBalance.balance >= 0 ? t('owes_you') : t('you_owe')}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-900 text-lg mb-3">{t('quick_actions')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            <Link
              to="/search"
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:shadow-md transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Search size={24} />
              </div>
              <span className="text-slate-600 font-medium">
                {language === 'es' ? 'Buscar' : 'Search'}
              </span>
            </Link>
            <button
              onClick={() => navigate('/add-expense')}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:shadow-md transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <PlusCircle size={24} />
              </div>
              <span className="text-slate-600 font-medium">
                {language === 'es' ? 'Gasto' : 'Expense'}
              </span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:shadow-md transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Plus size={24} />
              </div>
              <span className="text-slate-600 font-medium">
                {t('create_group')}
              </span>
            </button>
            <Link
              to={`/settle/${userBalance?.groupId || 'groups'}`}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:shadow-md transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Handshake size={24} />
              </div>
              <span className="text-slate-600 font-medium">
                {language === 'es' ? 'Saldar' : 'Settle'}
              </span>
            </Link>
          </div>
        </div>

        {/* Your Groups */}
        <div>
          <h3 className="font-semibold text-slate-900 text-lg mb-3">
            {language === 'es' ? 'Tus Grupos' : 'Your Groups'}
          </h3>

          {groupsLoading ? (
            <div className="max-w-lg mx-auto px-4 py-6">
              <SkeletonGroupGrid count={3} />
            </div>
          ) : groups.length === 0 ? (
          <EmptyState type="groups" onAction={() => setShowCreate(true)} />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {groups.map(g => (
                <GroupCard key={g.id} group={g} icon={getGroupIcon(g.type)} userId={user?.id} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB - Create Group */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed right-4 bottom-24 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-30 active:scale-95 transition shadow-indigo-200"
      >
        <Plus size={28} />
      </button>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center rounded-t-2xl">
              <button onClick={() => { setShowCreate(false); setMemberList([]); }} className="text-slate-500 font-medium">
                {t('cancel')}
              </button>
              <h3 className="font-bold text-slate-900">{t('create_group')}</h3>
              <button onClick={createGroup} disabled={creating || !groupName.trim()} className="text-indigo-600 font-bold disabled:opacity-40">
                {creating ? t('creating') : t('create')}
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Group Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm">
                        <type.icon size={20} className="text-indigo-600" />
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {language === 'es' ? type.labelEs : type.labelEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('group_name')}</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={language === 'es' ? 'Ej: Casa volcanes credito' : 'e.g. House expenses'}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('description')}</label>
                <input
                  type="text"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder={language === 'es' ? 'Descripción opcional' : 'Optional description'}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {language === 'es' ? 'Agregar miembros' : 'Add members'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => { setMemberEmail(e.target.value); setMemberError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember(); }}}
                    placeholder={language === 'es' ? 'correo@ejemplo.com' : 'email@example.com'}
                    className="flex-1 border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base"
                  />
                  <button type="button" onClick={addMember} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm flex-shrink-0">
                    <Plus size={20} />
                  </button>
                </div>
                {memberError && <p className="text-rose-500 text-xs mt-1">{memberError}</p>}
              </div>

              {/* Quick-add from existing friends */}
              {existingFriends.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                          className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full px-3 py-1.5 transition active:scale-95"
                        >
                          <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-[10px]">
                            {f.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-indigo-800">{f.name}</span>
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
                    <div key={m.email} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-900">{m.name}</span>
                        <span className="text-xs text-slate-400">{m.email}</span>
                      </div>
                      <button onClick={() => removeMember(m.email)} className="text-rose-400 hover:text-rose-600 text-lg">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-slate-900">{user?.name}</span>
                <span className="text-xs text-indigo-600 ml-auto">
                  {language === 'es' ? '(tú — agregado automáticamente)' : '(you — added automatically)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      </PageTransition>
      <BottomNav />
    </div>
  );
}

// Group card with balance — uses its own query per group
function GroupCard({ group, icon, userId }) {
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
      className="block bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-indigo-300 transition transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">
          <icon size={32} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 truncate">{group.name}</h4>
          {group.description && <p className="text-sm text-slate-500 truncate">{group.description}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          {Math.abs(balanceAmount) > 0.01 ? (
            <span className={`font-bold text-lg ${balanceAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {balanceAmount > 0 ? '+' : '-'}MX$ {Math.abs(balanceAmount).toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              {language === 'es' ? 'Saldado' : 'Settled'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
