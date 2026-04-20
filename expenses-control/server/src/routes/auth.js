const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../db');

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
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and a number' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const [userId] = await db('users').insert({ name, email, password: hashedPassword });
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, JWT_COOKIE_OPTIONS);
    res.status(201).json({ user: { id: userId, name, email } });
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
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
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
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
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

// Generate 2FA secret and QR code (requires auth)
const auth = require('../middleware/auth');
router.use(auth);

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

module.exports = router;