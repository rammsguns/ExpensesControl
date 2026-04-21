import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import api from '../api';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');

  // Password strength requirements
  const requirements = [
    { label: 'At least 10 characters', test: (p) => p.length >= 10 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const metRequirements = requirements.filter((r) => r.test(password));
  const strength = metRequirements.length;
  const strengthColor =
    strength <= 2 ? 'text-red-500' : strength <= 3 ? 'text-yellow-500' : strength <= 4 ? 'text-blue-500' : 'text-green-500';
  const strengthLabel =
    strength <= 2 ? 'Weak' : strength <= 3 ? 'Fair' : strength <= 4 ? 'Good' : 'Strong';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (strength < requirements.length) {
      setError('Password does not meet all requirements');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      // Auto-login after register
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-600">💰 ExpensesControl</h1>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Strength: {strengthLabel}</span>
                <div className="flex gap-1">
                  {requirements.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full ${i < strength ? strengthColor.replace('text-', 'bg-') : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
              <ul className="space-y-1">
                {requirements.map((req) => (
                  <li key={req.label} className={`text-xs flex items-center gap-1.5 ${req.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{req.test(password) ? '✓' : '○'}</span>
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirm_password')}</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || strength < requirements.length}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : t('register')}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-500">
          {t('has_account')} <Link to="/login" className="text-emerald-600 font-medium">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
}
