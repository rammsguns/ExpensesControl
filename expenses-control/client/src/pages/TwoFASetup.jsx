import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function TwoFASetup() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = React.useState('loading'); // loading, setup, verify, done
  const [secret, setSecret] = React.useState('');
  const [qr, setQr] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setup2FA();
  }, []);

  const setup2FA = async () => {
    try {
      const res = await api.post('/auth/2fa/setup');
      setSecret(res.data.secret);
      setQr(res.data.qr);
      setStep('setup');
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed');
      setStep('setup');
    }
  };

  const enable = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/2fa/enable', { code });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-xl">←</button>
          <h1 className="text-xl font-bold text-gray-800">
            {language === 'es' ? 'Autenticación de dos factores' : 'Two-Factor Authentication'}
          </h1>
        </div>

        {step === 'loading' && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">{t('loading')}</p>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-800 mb-3">
                {language === 'es' ? 'Paso 1: Escanea el código QR' : 'Step 1: Scan the QR code'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {language === 'es'
                  ? 'Abre tu app de autenticación (Google Authenticator, Authy, etc.) y escanea este código:'
                  : 'Open your authenticator app (Google Authenticator, Authy, etc.) and scan this code:'}
              </p>

              {/* QR Code */}
              {qr && (
                <div className="flex justify-center mb-4">
                  <img src={qr} alt="2FA QR Code" className="w-48 h-48 rounded-lg border" />
                </div>
              )}

              {/* Manual entry key */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">
                  {language === 'es' ? 'Clave manual:' : 'Manual entry key:'}
                </p>
                <p className="font-mono text-sm text-gray-800 break-all select-all">{secret}</p>
              </div>
            </div>

            {/* Verify step */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-800 mb-3">
                {language === 'es' ? 'Paso 2: Verifica el código' : 'Step 2: Verify the code'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {language === 'es'
                  ? 'Ingresa el código de 6 dígitos de tu app de autenticación:'
                  : 'Enter the 6-digit code from your authenticator app:'}
              </p>

              <form onSubmit={enable} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                  placeholder="000000"
                  className="w-full text-center text-3xl tracking-[0.5em] font-mono border rounded-xl px-4 py-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={code.length !== 6 || loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-3 font-semibold disabled:opacity-40 transition"
                >
                  {loading ? '...' : t('2fa_enable')}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {language === 'es' ? '¡2FA activado!' : '2FA Enabled!'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {language === 'es'
                ? 'Tu cuenta ahora está protegida con autenticación de dos factores.'
                : 'Your account is now protected with two-factor authentication.'}
            </p>
            <button
              onClick={() => navigate('/account')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6 py-3 font-semibold transition"
            >
              {language === 'es' ? 'Volver a mi cuenta' : 'Back to my account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}