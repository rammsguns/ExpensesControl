import React from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import PageTransition from '../components/PageTransition';
import { Users, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function JoinGroup() {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('invite');
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = React.useState('loading'); // loading, valid, invalid, joined
  const [group, setGroup] = React.useState(null);
  const [error, setError] = React.useState('');
  const [joining, setJoining] = React.useState(false);

  React.useEffect(() => {
    if (!token || !groupId) {
      setStatus('invalid');
      setError(language === 'es' ? 'Enlace de invitación inválido' : 'Invalid invite link');
      return;
    }

    api.get(`/invites/validate?token=${encodeURIComponent(token)}&groupId=${encodeURIComponent(groupId)}`)
      .then(res => {
        if (res.data.valid) {
          setGroup(res.data.group);
          setStatus('valid');
        } else {
          setStatus('invalid');
          setError(res.data.error || (language === 'es' ? 'Invitación inválida' : 'Invalid invite'));
        }
      })
      .catch(err => {
        setStatus('invalid');
        setError(err.response?.data?.error || (language === 'es' ? 'Error al validar invitación' : 'Failed to validate invite'));
      });
  }, [token, groupId, language]);

  const handleJoin = async () => {
    if (!token || !groupId) return;
    setJoining(true);
    try {
      await api.post('/invites/join', { token, groupId });
      setStatus('joined');
      toast.success(language === 'es' ? '¡Te uniste al grupo!' : 'You joined the group!');
      setTimeout(() => {
        navigate(`/group/${groupId}`);
      }, 1500);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error(language === 'es' ? 'Ya eres miembro de este grupo' : 'You are already a member of this group');
        setTimeout(() => navigate(`/group/${groupId}`), 1500);
      } else {
        toast.error(err.response?.data?.error || (language === 'es' ? 'Error al unirse' : 'Failed to join'));
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 safe-area-bottom">
      <Navbar />
      <PageTransition>
        <div className="max-w-lg mx-auto px-4 py-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{language === 'es' ? 'Volver' : 'Back'}</span>
          </button>

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
              <p className="text-slate-500">{language === 'es' ? 'Validando invitación...' : 'Validating invite...'}</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{language === 'es' ? 'Invitación inválida' : 'Invalid Invite'}</h2>
              <p className="text-slate-500 mb-6">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-medium transition"
              >
                {language === 'es' ? 'Ir al inicio' : 'Go home'}
              </button>
            </div>
          )}

          {status === 'valid' && group && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">{group.name}</h2>
              {group.description && (
                <p className="text-slate-500 text-sm mb-6">{group.description}</p>
              )}
              <p className="text-slate-500 text-sm mb-6">
                {language === 'es'
                  ? 'Has sido invitado a unirte a este grupo.'
                  : 'You have been invited to join this group.'}
              </p>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl px-6 py-3 font-medium transition active:scale-[0.97]"
              >
                {joining
                  ? (language === 'es' ? 'Uniendo...' : 'Joining...')
                  : (language === 'es' ? 'Unirse al grupo' : 'Join Group')}
              </button>
            </div>
          )}

          {status === 'joined' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{language === 'es' ? '¡Te uniste!' : 'You joined!'}</h2>
              <p className="text-slate-500">{language === 'es' ? 'Redirigiendo al grupo...' : 'Redirecting to group...'}</p>
            </div>
          )}
        </div>
      </PageTransition>
      <BottomNav />
    </div>
  );
}
