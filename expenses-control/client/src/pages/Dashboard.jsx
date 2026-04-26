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
import { Search, PlusCircle, Users, Handshake, Home, Plus, Plane, Heart, MoreHorizontal, X } from 'lucide-react';
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
  const [fieldErrors, setFieldErrors] = React.useState({});

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

  const validateCreateForm = () => {
    const errors = {};
    if (!groupName.trim()) errors.groupName = language === 'es' ? 'Nombre requerido' : 'Group name is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) return;
    setCreating(true);
    try {
      const res = await api.post('/groups', { name: groupName, description: groupDesc, type: groupType });
      const groupId = res.data.id;
      for (const member of memberList) {
        try { await api.post(`/groups/${groupId}/members`, { email: member.email }); } catch {}
      }
      setShowCreate(false);
      toast.success(typeof t === 'function' ? t('group_created') : 'Group created!');
      setGroupName(''); setGroupDesc(''); setGroupType('home');
      setMemberList([]); setMemberEmail('');
      setFieldErrors({});
      qc.invalidateQueries({ queryKey: ['groups'] });
      navigate(`/group/${groupId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || (typeof t === 'function' ? t('error') : 'Something went wrong'));
    }
    setCreating(false);
  };

  const userBalance = balances.find(b => b.userId === user?.id);
  const getGroupIcon = (type) => GROUP_TYPES.find(g => g.id === type)?.icon || MoreHorizontal;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />
      <PageTransition>
        <div id="main-content" tabIndex="-1" className="max-w-lg mx-auto px-4 py-6">


          {/* Quick Actions - Compact 2x2 grid */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 text-base mb-3 leading-snug">
              {typeof t === 'function' ? t('quick_actions') : 'Quick Actions'}
            </h3>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {[
                {
                  icon: PlusCircle,
                  bg: 'bg-emerald-50',
                  text: 'text-emerald-600',
                  label: language === 'es' ? 'Gasto' : 'Expense',
                  isButton: true,
                  onClick: () => {
                    if (groups && groups.length > 0 && groups[0]?.id) {
                      navigate(`/add-expense/${groups[0].id}`);
                    } else {
                      toast.error(language === 'es' ? 'Crea un grupo primero' : 'Create a group first');
                    }
                  }
                },
                { to: '/search', icon: Search, bg: 'bg-indigo-50', text: 'text-indigo-600', label: language === 'es' ? 'Buscar' : 'Search' },
                { icon: Plus, bg: 'bg-violet-50', text: 'text-violet-600', label: language === 'es' ? 'Grupo' : 'Group', isButton: true, onClick: () => setShowCreate(true) },
                { to: `/settle/${userBalance?.groupId || 'groups'}`, icon: Handshake, bg: 'bg-amber-50', text: 'text-amber-600', label: language === 'es' ? 'Saldar' : 'Settle' },
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item.to || '#'}
                  className="flex flex-col items-center justify-center gap-1.5 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 hover:shadow-md hover:border-indigo-200 active:scale-[0.97] transition-all duration-200 ease-in-out h-[88px]"
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon size={20} className={item.text} aria-hidden="true" />
                  </div>
                  <span className="text-slate-700 font-medium text-xs leading-tight text-center">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Your Groups */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-lg leading-snug">
                {language === 'es' ? 'Tus Grupos' : 'Your Groups'}
              </h3>
            </div>

            {groupsLoading ? (
              <SkeletonGroupGrid count={4} />
            ) : groups.length === 0 ? (
              <EmptyState type="groups" onAction={() => setShowCreate(true)} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {groups.map(g => (
                  <GroupCard key={g.id} group={g} icon={getGroupIcon(g.type)} userId={user?.id} />
                ))}
              </div>
            )}
          </div>

          {/* Total Balance - Moved to bottom */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg p-4 md:p-5 text-white mb-4 mt-6">
            <h3 className="font-semibold text-indigo-100 mb-1.5 text-sm leading-relaxed">
              {typeof t === 'function' ? t('total_balance') : 'Total Balance'}
            </h3>
            {userBalance && (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl md:text-3xl font-bold leading-tight">
                  MX$ {Math.abs(userBalance.balance).toFixed(2)}
                </span>
                <span className="text-sm font-normal text-indigo-200 leading-relaxed">
                  {userBalance.balance >= 0 ? (typeof t === 'function' ? t('owes_you') : 'owes you') : (typeof t === 'function' ? t('you_owe') : 'you owe')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* FAB - Create Group */}
        <button
          onClick={() => setShowCreate(true)}
          className="fixed right-4 bottom-28 w-14 h-14 min-h-[56px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-all duration-150 ease-in-out active:scale-95 focus-ring"
          aria-label={typeof t === 'function' ? t('create_group') : 'Create group'}
        >
          <Plus size={28} aria-hidden="true" />
        </button>

        {/* Create Group Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center rounded-t-2xl z-10">
                <button 
                  onClick={() => { setShowCreate(false); setMemberList([]); setFieldErrors({}); }} 
                  className="min-h-[44px] px-3 text-slate-500 font-medium hover:text-slate-700 transition-colors duration-150 rounded-lg focus-ring"
                >
                  {typeof t === 'function' ? t('cancel') : 'Cancel'}
                </button>
                <h3 className="font-bold text-slate-900 text-base">{typeof t === 'function' ? t('create_group') : 'Create Group'}</h3>
                <button 
                  onClick={createGroup} 
                  disabled={creating || !groupName.trim()} 
                  className="min-h-[44px] px-3 text-indigo-600 font-bold disabled:opacity-40 transition-opacity duration-150 rounded-lg focus-ring"
                >
                  {creating ? (typeof t === 'function' ? t('creating') : 'Creating...') : (typeof t === 'function' ? t('create') : 'Create')}
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Group Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    {language === 'es' ? 'Tipo de grupo' : 'Group type'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {GROUP_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setGroupType(type.id)}
                        className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all duration-150 min-h-[80px] ${
                          groupType === type.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm">
                          <type.icon size={20} className="text-indigo-600" aria-hidden="true" />
                        </div>
                        <span className="text-xs font-medium text-slate-700 leading-tight">
                          {language === 'es' ? type.labelEs : type.labelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {typeof t === 'function' ? t('group_name') : 'Group Name'}
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => { setGroupName(e.target.value); setFieldErrors(prev => ({ ...prev, groupName: '' })); }}
                    placeholder={language === 'es' ? 'Ej: Casa volcanes credito' : 'e.g. House expenses'}
                    className={`w-full border rounded-xl px-4 py-3 text-base min-h-[48px] transition-all duration-150 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
                      fieldErrors.groupName ? 'border-rose-300 bg-rose-50' : 'border-slate-300'
                    }`}
                    autoFocus
                    required
                    aria-invalid={!!fieldErrors.groupName}
                    aria-describedby={fieldErrors.groupName ? 'group-name-error' : undefined}
                  />
                  {fieldErrors.groupName && (
                    <p id="group-name-error" className="mt-1.5 text-sm text-rose-600" role="alert">{fieldErrors.groupName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {typeof t === 'function' ? t('description') : 'Description'}
                  </label>
                  <input
                    type="text"
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    placeholder={language === 'es' ? 'Descripción opcional' : 'Optional description'}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base min-h-[48px] transition-all duration-150 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Members */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {typeof t === 'function' ? t('members') || 'Members' : 'Members'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => { setMemberEmail(e.target.value); setMemberError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }}
                      placeholder={language === 'es' ? 'Correo del miembro' : 'Member email'}
                      className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-base min-h-[48px] transition-all duration-150 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={addMember}
                      className="min-h-[48px] px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium transition-all duration-150 active:scale-[0.97] focus-ring"
                    >
                      {language === 'es' ? 'Agregar' : 'Add'}
                    </button>
                  </div>
                  {memberError && (
                    <p className="mt-1.5 text-sm text-rose-600" role="alert">{memberError}</p>
                  )}

                  {/* Suggested Members */}
                  {existingFriends.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-500 mb-2">
                        {language === 'es' ? 'Sugerencias' : 'Suggestions'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {existingFriends
                          .filter(f => !memberList.some(m => m.email === f.email) && f.email !== user?.email)
                          .slice(0, 8)
                          .map(friend => (
                            <button
                              key={friend.email}
                              type="button"
                              onClick={() => {
                                setMemberList(prev => [...prev, { name: friend.name, email: friend.email }]);
                                setMemberError('');
                              }}
                              className="flex items-center gap-2 bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-full pl-1 pr-3 py-1 transition-all duration-150 active:scale-95 focus-ring"
                            >
                              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                {friend.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{friend.name}</span>
                              <Plus size={14} className="text-indigo-500" />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Already added members */}
                {memberList.length > 0 && (
                  <div className="space-y-2">
                    {memberList.map(m => (
                      <div key={m.email} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm text-slate-900 font-medium block truncate">{m.name}</span>
                            <span className="text-xs text-slate-400 block truncate">{m.email}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeMember(m.email)} 
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-rose-400 hover:text-rose-600 rounded-lg transition-colors duration-150 focus-ring flex-shrink-0"
                          aria-label={`Remove ${m.name}`}
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Current user */}
                <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-slate-900 font-medium">{user?.name}</span>
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

// Group card with balance
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
      className="block bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 hover:shadow-md hover:border-indigo-200 active:scale-[0.98] transition-all duration-200 ease-in-out"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
          {React.createElement(icon, { size: 24, className: "text-indigo-600", 'aria-hidden': true })}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate leading-snug">{group.name}</h4>
          {group.description && <p className="text-sm text-slate-500 truncate leading-relaxed">{group.description}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          {Math.abs(balanceAmount) > 0.01 ? (
            <span className={`font-bold text-base ${balanceAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
