import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // If 2FA is required, redirect to 2FA verification
      if (res.data.requires2FA) {
        navigate('/2fa-login', { state: { tempToken: res.data.tempToken }, replace: true });
        return;
      }

      // AuthContext.login expects (email, password) and calls the API itself,
      // but we already have the response — so set token/user directly
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || t('login_error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💸</div>
          <h1 className="text-2xl font-bold text-gray-800">ExpensesControl</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('email')}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password')}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-3 font-semibold disabled:opacity-50 transition"
          >
            {loading ? '...' : t('login')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('no_account')} <Link to="/register" className="text-emerald-600 font-medium">{t('register')}</Link>
        </p>
      </div>
    </div>
  );
}