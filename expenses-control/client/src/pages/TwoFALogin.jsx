import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n';
import api from '../api';

export default function TwoFALogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const tempToken = location.state?.tempToken;

  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // If no tempToken, redirect to login
  React.useEffect(() => {
    if (!tempToken) navigate('/login', { replace: true });
  }, [tempToken, navigate]);

  const verify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/login', { tempToken, code });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">2FA</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {t('2fa_login_prompt')}
          </p>
        </div>

        <form onSubmit={verify} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-[0.5em] font-mono border rounded-xl px-4 py-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              autoFocus
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-3 font-semibold disabled:opacity-40 transition"
          >
            {loading ? '...' : t('verify')}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
          >
            {t('back_to_login')}
          </button>
        </form>
      </div>
    </div>
  );
}