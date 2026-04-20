const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
const settlementRoutes = require('./routes/settlements');
const balanceRoutes = require('./routes/balances');

// Startup warning for weak secrets
const DEFAULT_SECRETS = [
  'super_secret_key_for_dev_only',
  'change_me_to_a_long_random_string',
  'change_me_to_a_64_char_hex_string',
];
if (DEFAULT_SECRETS.includes(process.env.JWT_SECRET)) {
  console.warn('⚠️  WARNING: JWT_SECRET is using a default/placeholder value. Change it before production!');
}
if (DEFAULT_SECRETS.includes(process.env.ENCRYPTION_KEY)) {
  console.warn('⚠️  WARNING: ENCRYPTION_KEY is using a default/placeholder value. Change it before production!');
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: restrict to configured origin(s)
const corsOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigins.split(',').map(o => o.trim()),
  credentials: true,
}));

// General rate limiter: 100 req/min per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(generalLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/balances', balanceRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    console.log('Running migrations...');
    await db.migrate.latest();

    // Only run seeds in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Running seeds...');
      await db.seed.run();
    }
    console.log('Database ready!');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();