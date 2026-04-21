import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send cookies automatically
});

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
    return Promise.reject(error);
  }
);

export default api;
export { getCsrfToken };