import { useState, useEffect, useCallback } from 'react';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import api from '../api';

export function useBiometric() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSupported(browserSupportsWebAuthn());
  }, []);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await api.get('/auth/webauthn/credentials');
      setCredentials(res.data || []);
      setIsRegistered((res.data || []).length > 0);
    } catch {
      setCredentials([]);
      setIsRegistered(false);
    }
  }, []);

  useEffect(() => {
    if (isSupported) {
      fetchCredentials();
    }
  }, [isSupported, fetchCredentials]);

  const register = async (deviceName) => {
    setLoading(true);
    try {
      // 1. Get registration options from server
      const optionsRes = await api.get('/auth/webauthn/register-options');
      const options = optionsRes.data;

      // 2. Start WebAuthn registration in browser
      const attestation = await startRegistration({ optionsJSON: options });

      // 3. Send attestation to server for verification
      await api.post('/auth/webauthn/register', {
        credential: attestation,
        deviceName,
      });

      await fetchCredentials();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const authenticate = async (email) => {
    setLoading(true);
    try {
      // 1. Get authentication options from server
      const optionsRes = await api.post('/auth/webauthn/authenticate-options', { email });
      const options = optionsRes.data;

      // 2. Start WebAuthn authentication in browser
      const assertion = await startAuthentication({ optionsJSON: options });

      // 3. Send assertion to server for verification
      const authRes = await api.post('/auth/webauthn/authenticate', {
        credential: assertion,
        email,
      });

      return { success: true, user: authRes.data.user };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const removeCredential = async (id) => {
    try {
      await api.delete(`/auth/webauthn/credentials/${id}`);
      await fetchCredentials();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to remove credential';
      return { success: false, error: msg };
    }
  };

  return {
    isSupported,
    isRegistered,
    credentials,
    loading,
    register,
    authenticate,
    removeCredential,
    refreshCredentials: fetchCredentials,
  };
}
