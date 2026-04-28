const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../db');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

// Encrypt a string using AES-256-GCM
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// Decrypt a string using AES-256-GCM
function decrypt(encryptedStr) {
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const JWT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24h
  secure: process.env.NODE_ENV === 'production', // enable in production with HTTPS
};

// Auth rate limiter: 5 attempts per minute per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, currency, language } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  // Password strength validation
  const errors = [];
  if (password.length < 10) errors.push('at least 10 characters');
  if (!/[A-Z]/.test(password)) errors.push('an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('a number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('a special character');
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: `Password must contain ${errors.join(', ')}` 
    });
  }
  try {
    // Default currency based on language or explicit choice
    const defaultCurrency = currency || (language === 'es' ? 'MXN' : 'USD');
    const hashedPassword = await bcrypt.hash(password, 12);
    const [userId] = await db('users').insert({
      name,
      email,
      password: hashedPassword,
      currency: defaultCurrency
    });
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, JWT_COOKIE_OPTIONS);
    res.status(201).json({
      user: {
        id: userId,
        name,
        email,
        is_premium: false,
        monthly_expense_limit: 100,
        currency: defaultCurrency
      }
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db('users').where({ email }).first();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If 2FA is enabled, return a temp token and require verification
    if (user.two_factor_enabled) {
      const tempToken = jwt.sign(
        { id: user.id, requires2FA: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({ requires2FA: true, tempToken });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, JWT_COOKIE_OPTIONS);
    res.json({ user: { id: user.id, name: user.name, email: user.email, is_premium: user.is_premium, monthly_expense_limit: user.monthly_expense_limit, currency: user.currency, max_groups: user.max_groups, max_members_per_group: user.max_members_per_group } });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify 2FA code during login
router.post('/2fa/login', authLimiter, async (req, res) => {
  const { tempToken, code } = req.body;
  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.requires2FA) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await db('users').where({ id: decoded.id }).first();
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
      return res.status(400).json({ error: '2FA not enabled for this user' });
    }

    const decryptedSecret = decrypt(user.two_factor_secret);
    authenticator.options = { window: 1 };
    const isValid = authenticator.verify({ token: code, secret: decryptedSecret });
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, JWT_COOKIE_OPTIONS);
    res.json({ user: { id: user.id, name: user.name, email: user.email, is_premium: user.is_premium, monthly_expense_limit: user.monthly_expense_limit, currency: user.currency, max_groups: user.max_groups, max_members_per_group: user.max_members_per_group } });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout — clear cookie
router.post('/logout', async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Logged out' });
});

// ── WebAuthn (Biometric Authentication) ────────────────────────────

// RP configuration
const RP_NAME = 'ExpensesControl';
const RP_ID = process.env.WEBAUTHN_RP_ID || (process.env.NODE_ENV === 'production' ? 'expensescontrol.app' : 'localhost');
const ORIGIN = process.env.WEBAUTHN_ORIGIN || (process.env.NODE_ENV === 'production' ? 'https://expensescontrol.app' : 'http://localhost:5176');

// GET /auth/webauthn/register-options — requires auth (user already logged in)
router.get('/webauthn/register-options', async (req, res) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users').where({ id: payload.id }).first();
    if (!user) return res.status(401).json({ error: 'User not found' });

    const existingCreds = await db('webauthn_credentials').where({ user_id: user.id });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: String(user.id),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: existingCreds.map(c => ({
        id: Buffer.from(c.id, 'base64url'),
        transports: JSON.parse(c.transports || '[]'),
      })),
    });

    // Store challenge temporarily in user record (or in-memory; using a simple cache here)
    // We'll use a signed cookie for the challenge
    const challengeToken = jwt.sign(
      { challenge: options.challenge, userId: user.id, type: 'webauthn-register' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
    res.cookie('webauthn_challenge', challengeToken, { httpOnly: true, sameSite: 'strict', maxAge: 5 * 60 * 1000 });

    res.json(options);
  } catch (err) {
    console.error('WebAuthn register options error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/webauthn/register — verify and store credential
router.post('/webauthn/register', async (req, res) => {
  const { credential, deviceName } = req.body;
  const challengeToken = req.cookies?.webauthn_challenge;
  if (!challengeToken) {
    return res.status(400).json({ error: 'Challenge expired or missing' });
  }

  try {
    const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
    if (decoded.type !== 'webauthn-register') {
      return res.status(400).json({ error: 'Invalid challenge type' });
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: decoded.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Registration verification failed' });
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    await db('webauthn_credentials').insert({
      id: Buffer.from(credentialID).toString('base64url'),
      user_id: decoded.userId,
      public_key: Buffer.from(credentialPublicKey).toString('base64url'),
      counter: counter || 0,
      transports: JSON.stringify(credential.response?.transports || []),
      device_name: deviceName || null,
      created_at: new Date().toISOString(),
    });

    res.clearCookie('webauthn_challenge', { httpOnly: true, sameSite: 'strict' });
    res.json({ message: 'Biometric credential registered' });
  } catch (err) {
    console.error('WebAuthn register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/webauthn/authenticate — authenticate with biometric, return JWT
router.post('/webauthn/authenticate', async (req, res) => {
  const { credential, email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = await db('users').where({ email }).first();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const creds = await db('webauthn_credentials').where({ user_id: user.id });
    if (!creds.length) return res.status(401).json({ error: 'No biometric credentials found' });

    // Use challenge from credential response (stored client-side during the flow)
    // We need to generate options first to have a challenge; frontend calls /authenticate-options before authenticating
    // But to support the flow where frontend passes challenge, we use a cookie-based challenge
    const challengeToken = req.cookies?.webauthn_auth_challenge;
    if (!challengeToken) return res.status(400).json({ error: 'Challenge expired or missing' });

    const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
    if (decoded.type !== 'webauthn-auth') return res.status(400).json({ error: 'Invalid challenge type' });

    const expectedCredentialID = credential.id;
    const storedCred = creds.find(c => c.id === expectedCredentialID);
    if (!storedCred) return res.status(401).json({ error: 'Credential not found' });

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: decoded.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: storedCred.id,
        publicKey: Buffer.from(storedCred.public_key, 'base64url'),
        counter: storedCred.counter,
        transports: JSON.parse(storedCred.transports || '[]'),
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      return res.status(401).json({ error: 'Authentication verification failed' });
    }

    // Update counter
    await db('webauthn_credentials')
      .where({ id: storedCred.id })
      .update({ counter: verification.authenticationInfo.newCounter, last_used_at: new Date().toISOString() });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, JWT_COOKIE_OPTIONS);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_premium: user.is_premium,
        monthly_expense_limit: user.monthly_expense_limit,
        currency: user.currency,
        max_groups: user.max_groups,
        max_members_per_group: user.max_members_per_group,
      }
    });
  } catch (err) {
    console.error('WebAuthn authenticate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/webauthn/authenticate-options — generate auth options for a given email
router.post('/webauthn/authenticate-options', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = await db('users').where({ email }).first();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const creds = await db('webauthn_credentials').where({ user_id: user.id });
    if (!creds.length) return res.status(401).json({ error: 'No biometric credentials found' });

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: creds.map(c => ({
        id: c.id,
        transports: JSON.parse(c.transports || '[]'),
      })),
      userVerification: 'preferred',
    });

    const challengeToken = jwt.sign(
      { challenge: options.challenge, userId: user.id, type: 'webauthn-auth' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
    res.cookie('webauthn_auth_challenge', challengeToken, { httpOnly: true, sameSite: 'strict', maxAge: 5 * 60 * 1000 });

    res.json(options);
  } catch (err) {
    console.error('WebAuthn authenticate options error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate 2FA secret and QR code (requires auth)
const auth = require('../middleware/auth');
router.use(auth);

// GET /auth/webauthn/credentials — list user's credentials
router.get('/webauthn/credentials', async (req, res) => {
  try {
    const creds = await db('webauthn_credentials')
      .where({ user_id: req.user.id })
      .select('id', 'device_name', 'created_at', 'last_used_at');
    res.json(creds);
  } catch (err) {
    console.error('WebAuthn credentials list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /auth/webauthn/credentials/:id — delete a credential
router.delete('/webauthn/credentials/:id', async (req, res) => {
  try {
    const deleted = await db('webauthn_credentials')
      .where({ id: req.params.id, user_id: req.user.id })
      .del();
    if (!deleted) return res.status(404).json({ error: 'Credential not found' });
    res.json({ message: 'Credential removed' });
  } catch (err) {
    console.error('WebAuthn credential delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/2fa/setup', async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const secret = authenticator.generateSecret();
    const serviceName = 'ExpensesControl';
    const otpauth = authenticator.keyuri(user.email, serviceName, secret);

    const qrDataUrl = await QRCode.toDataURL(otpauth);

    // Store encrypted secret (not enabled yet — must verify first)
    const encryptedSecret = encrypt(secret);
    await db('users').where({ id: req.user.id }).update({ two_factor_secret: encryptedSecret });

    // Only return the QR — do NOT leak the raw secret
    res.json({ qr: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify and enable 2FA (requires auth)
router.post('/2fa/enable', async (req, res) => {
  const { code } = req.body;
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user.two_factor_secret) {
      return res.status(400).json({ error: 'Setup required first' });
    }
    if (user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA already enabled' });
    }

    const decryptedSecret = decrypt(user.two_factor_secret);
    authenticator.options = { window: 1 };
    const isValid = authenticator.verify({ token: code, secret: decryptedSecret });
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    await db('users').where({ id: req.user.id }).update({ two_factor_enabled: true });
    res.json({ message: '2FA enabled', enabled: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disable 2FA (requires auth + current code)
router.post('/2fa/disable', async (req, res) => {
  const { code } = req.body;
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA not enabled' });
    }

    const decryptedSecret = decrypt(user.two_factor_secret);
    authenticator.options = { window: 1 };
    const isValid = authenticator.verify({ token: code, secret: decryptedSecret });
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    await db('users').where({ id: req.user.id }).update({
      two_factor_enabled: false,
      two_factor_secret: null
    });
    res.json({ message: '2FA disabled', enabled: false });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get 2FA status (requires auth)
router.get('/2fa/status', async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    res.json({ enabled: !!user.two_factor_enabled });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile with monthly expense count
router.get('/me', async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count expenses this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const expenseCount = await db('expenses')
      .where({ paid_by: req.user.id })
      .where('created_at', '>=', startOfMonth.toISOString())
      .where('created_at', '<', endOfMonth.toISOString())
      .count('id as count')
      .first();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      is_premium: user.is_premium,
      monthly_expense_limit: user.monthly_expense_limit,
      monthly_expense_count: parseInt(expenseCount?.count || 0, 10),
      currency: user.currency,
      max_groups: user.max_groups,
      max_members_per_group: user.max_members_per_group
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simulate premium upgrade (no real payment processing)
router.post('/upgrade', async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_premium) {
      return res.status(400).json({ error: 'User is already premium' });
    }

    // In production, this would integrate with Stripe/PayPal
    // For now, simulate successful payment
    await db('users').where({ id: req.user.id }).update({
      is_premium: true,
      monthly_expense_limit: null, // unlimited
      max_groups: null,
      max_members_per_group: null
    });

    res.json({
      message: 'Premium activated successfully',
      is_premium: true,
      monthly_expense_limit: null
    });
  } catch (err) {
    console.error('Upgrade error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user's default currency
router.put('/currency', async (req, res) => {
  const { currency } = req.body;
  const VALID_CURRENCIES = ['USD','MXN','EUR','GBP','CAD','AUD','JPY','BRL','ARS','COP','CLP','PEN'];
  if (!currency || !VALID_CURRENCIES.includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }
  try {
    await db('users').where({ id: req.user.id }).update({ currency });
    const updatedUser = await db('users').where({ id: req.user.id }).first();
    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      is_premium: updatedUser.is_premium,
      monthly_expense_limit: updatedUser.monthly_expense_limit,
      monthly_expense_count: updatedUser.monthly_expense_count,
      currency: updatedUser.currency
    });
  } catch (err) {
    console.error('Update currency error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;