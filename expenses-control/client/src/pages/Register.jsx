import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import api from '../api';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

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
  const strengthColorMap = [
    'bg-rose-500',
    'bg-rose-400',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-emerald-500',
  ];
  const strengthLabel =
    strength <= 2 ? 'Weak' : strength <= 3 ? 'Fair' : strength <= 4 ? 'Good' : 'Strong';
  const strengthTextColor =
    strength <= 2 ? 'text-rose-600' : strength <= 3 ? 'text-yellow-600' : strength <= 4 ? 'text-blue-600' : 'text-emerald-600';

  const validateField = (field, value) => {
    const errors = {};
    switch (field) {
      case 'name':
        if (!value.trim()) errors.name = 'Name is required';
        break;
      case 'email':
        if (!value.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Please enter a valid email';
        break;
      case 'password':
        if (!value) errors.password = 'Password is required';
        break;
      case 'confirmPassword':
        if (!value) errors.confirmPassword = 'Please confirm your password';
        else if (value !== password) errors.confirmPassword = 'Passwords do not match';
        break;
    }
    return errors;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldErr = validateField(field, 
      field === 'name' ? name : field === 'email' ? email : field === 'password' ? password : confirmPassword
    );
    setFieldErrors(prev => ({ ...prev, ...fieldErr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const allErrors = {
      ...validateField('name', name),
      ...validateField('email', email),
      ...validateField('password', password),
      ...validateField('confirmPassword', confirmPassword),
    };
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    setFieldErrors(allErrors);

    if (Object.keys(allErrors).length > 0) return;

    if (strength < requirements.length) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(typeof t === 'function' ? t('toast_registered') : 'Account created!');
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      toast.error(typeof t === 'function' ? t('toast_error_generic') : 'Something went wrong');
    }
    setLoading(false);
  };

  const inputClass = (field) =>
    `w-full border rounded-xl px-4 py-3 text-base min-h-[48px] transition-all duration-150 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
      touched[field] && fieldErrors[field] ? 'border-rose-300 bg-rose-50' : 'border-slate-300'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <PageTransition>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3" role="img" aria-label="Money bag emoji">💰</div>
            <h1 className="text-3xl font-bold text-indigo-600 leading-tight">ExpensesControl</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5" noValidate>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-start gap-3" role="alert">
                <X size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                {typeof t === 'function' ? t('name') : 'Name'}
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: '' })); }}
                onBlur={() => handleBlur('name')}
                className={inputClass('name')}
                required
                autoComplete="name"
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              />
              {touched.name && fieldErrors.name && (
                <p id="name-error" className="mt-1.5 text-sm text-rose-600" role="alert">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                {typeof t === 'function' ? t('email') : 'Email'}
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                onBlur={() => handleBlur('email')}
                className={inputClass('email')}
                required
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {touched.email && fieldErrors.email && (
                <p id="email-error" className="mt-1.5 text-sm text-rose-600" role="alert">{fieldErrors.email}</p>
              )}
            </div>

            <div className="relative">
              <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                {typeof t === 'function' ? t('password') : 'Password'}
              </label>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                onBlur={() => handleBlur('password')}
                className={`${inputClass('password')} pr-12`}
                required
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : 'password-strength'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {touched.password && fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-sm text-rose-600" role="alert">{fieldErrors.password}</p>
              )}
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div id="password-strength" className="space-y-2" aria-live="polite" aria-label="Password strength indicator">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Strength: <span className={strengthTextColor}>{strengthLabel}</span></span>
                  <div className="flex gap-1">
                    {requirements.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-6 rounded-full transition-colors duration-200 ${
                          i < strength ? strengthColorMap[strength - 1] : 'bg-slate-200'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <ul className="space-y-1">
                  {requirements.map((req) => (
                    <li key={req.label} className={`text-xs flex items-center gap-1.5 leading-relaxed ${
                      req.test(password) ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      <span className="flex-shrink-0">{req.test(password) ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}</span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="relative">
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">
                {typeof t === 'function' ? t('confirm_password') : 'Confirm Password'}
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                onBlur={() => handleBlur('confirmPassword')}
                className={inputClass('confirmPassword')}
                required
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.confirmPassword}
                aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
              />
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p id="confirm-error" className="mt-1.5 text-sm text-rose-600" role="alert">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl px-4 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="btn-spinner" aria-hidden="true" />
                  {typeof t === 'function' ? t('registering') || 'Creating account...' : 'Creating account...'}
                </span>
              ) : (
                typeof t === 'function' ? t('register') : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500 leading-relaxed">
            {typeof t === 'function' ? t('has_account') : 'Already have an account?'}{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-1">
              {typeof t === 'function' ? t('login') : 'Log In'}
            </Link>
          </p>
        </div>
      </PageTransition>
    </div>
  );
}
