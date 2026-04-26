import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState({});

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = typeof t === 'function' ? t('email_required') || 'Email is required' : 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = typeof t === 'function' ? t('email_invalid') || 'Please enter a valid email' : 'Please enter a valid email';
    if (!password) errors.password = typeof t === 'function' ? t('password_required') || 'Password is required' : 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.requires2FA) {
        navigate('/2fa-login', { state: { tempToken: res.data.tempToken }, replace: true });
        return;
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(typeof t === 'function' ? t('toast_login_success') : 'Welcome back!');
      window.location.href = '/';
    } catch (err) {
      const msg = err.response?.data?.error || (typeof t === 'function' ? t('login_error') : 'Login failed');
      setError(msg);
      toast.error(typeof t === 'function' ? t('toast_login_error') : 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <PageTransition>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3" role="img" aria-label="Money emoji">💸</div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">ExpensesControl</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                {typeof t === 'function' ? t('email') : 'Email'}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                placeholder={typeof t === 'function' ? t('email') : 'Email'}
                className={`w-full border rounded-xl px-4 py-3 text-base min-h-[48px] transition-all duration-150 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
                  fieldErrors.email ? 'border-rose-300 bg-rose-50' : 'border-slate-300'
                }`}
                required
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1.5 text-sm text-rose-600" role="alert">{fieldErrors.email}</p>
              )}
            </div>

            <div className="relative">
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                {typeof t === 'function' ? t('password') : 'Password'}
              </label>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                placeholder={typeof t === 'function' ? t('password') : 'Password'}
                className={`w-full border rounded-xl px-4 py-3 text-base min-h-[48px] transition-all duration-150 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-12 ${
                  fieldErrors.password ? 'border-rose-300 bg-rose-50' : 'border-slate-300'
                }`}
                required
                autoComplete="current-password"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors duration-150 rounded-lg focus-ring"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-sm text-rose-600" role="alert">{fieldErrors.password}</p>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-start gap-3" role="alert" aria-live="polite">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl px-4 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out active:scale-[0.98] focus-ring"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="btn-spinner" aria-hidden="true" />
                  {typeof t === 'function' ? t('logging_in') || 'Logging in...' : 'Logging in...'}
                </span>
              ) : (
                typeof t === 'function' ? t('login') : 'Log In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6 leading-relaxed">
            {typeof t === 'function' ? t('no_account') : "Don't have an account?"}{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors duration-150 focus-ring rounded px-1">
              {typeof t === 'function' ? t('register') : 'Register'}
            </Link>
          </p>
        </div>
      </PageTransition>
    </div>
  );
}
