const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const db = require('../db');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userId] = await db('users').insert({ name, email, password: hashedPassword });
    const token = jwt.sign({ id: userId, name }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: userId, name, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db('users').where({ email }).first();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If 2FA is enabled, return a temp token and require verification
    if (user.two_factor_enabled) {
      const tempToken = jwt.sign(
        { id: user.id, name: user.name, requires2FA: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({ requires2FA: true, tempToken });
    }

    const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify 2FA code during login
router.post('/2fa/login', async (req, res) => {
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

    authenticator.options = { window: 1 };
    const isValid = authenticator.verify({ token: code, secret: user.two_factor_secret });
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: err.message });
  }
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

    // Store secret temporarily (not enabled yet — must verify first)
    await db('users').where({ id: req.user.id }).update({ two_factor_secret: secret });

    res.json({ secret, qr: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    authenticator.options = { window: 1 };
    const isValid = authenticator.verify({ token: code, secret: user.two_factor_secret });
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    await db('users').where({ id: req.user.id }).update({ two_factor_enabled: true });
    res.json({ message: '2FA enabled', enabled: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    authenticator.options = { window: 1 };
    const isValid = authenticator.verify({ token: code, secret: user.two_factor_secret });
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    await db('users').where({ id: req.user.id }).update({
      two_factor_enabled: false,
      two_factor_secret: null
    });
    res.json({ message: '2FA disabled', enabled: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get 2FA status (requires auth)
router.get('/2fa/status', async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    res.json({ enabled: !!user.two_factor_enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;