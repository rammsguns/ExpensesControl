import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send cookies automatically
});

// Offline action queue
const OFFLINE_KEY = 'expenses_pending_actions';

function readQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeQueue(q) {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
}
function addToQueue(action) {
  const q = readQueue();
  q.push({ ...action, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: Date.now() });
  writeQueue(q);
}

// CSRF token management
// Read token from __csrf cookie, derive CSRF header value
function getCsrfSecretFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)__csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function deriveCsrfToken(secret) {
  // Must match server-side: HMAC-SHA256(secret, 'csrf') → hex
  // We can't compute HMAC in browser easily, so fetch from endpoint
  return null;
}

let csrfToken = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  try {
    const res = await axios.get('/api/auth/csrf-token', { withCredentials: true });
    csrfToken = res.data.csrfToken;
    return csrfToken;
  } catch {
    return null;
  }
}

// Attach CSRF token to all mutating requests
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const token = await getCsrfToken();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

// If we get a 403 with CSRF error, refresh token and retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.error === 'Invalid CSRF token') {
      csrfToken = null;
      const token = await getCsrfToken();
      if (token && error.config) {
        error.config.headers['X-CSRF-Token'] = token;
        return axios.request(error.config);
      }
    }
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Offline handling: queue POST/PUT/DELETE when no network
    const isOffline = !navigator.onLine || !error.response;
    const mutating = error.config && ['post', 'put', 'patch', 'delete'].includes(error.config.method);
    if (isOffline && mutating) {
      addToQueue({
        url: error.config.url,
        method: error.config.method.toUpperCase(),
        data: error.config.data ? JSON.parse(error.config.data) : undefined,
      });
      toast('Queued for sync', { icon: '⏳' });
      return Promise.resolve({ data: { queued: true } });
    }
    return Promise.reject(error);
  }
);

// Manual sync helper exposed on api object
api.syncPending = async function syncPending() {
  const q = readQueue();
  if (q.length === 0 || !navigator.onLine) return false;
  let syncedCount = 0;
  const remaining = [];
  for (const action of q) {
    try {
      await api({
        method: action.method.toLowerCase(),
        url: action.url,
        data: action.data,
      });
      syncedCount++;
    } catch {
      remaining.push(action);
    }
  }
  writeQueue(remaining);
  if (syncedCount > 0) {
    toast.success(`${syncedCount} synced successfully`);
  }
  return remaining.length === 0;
};

export default api;
export { getCsrfToken };
