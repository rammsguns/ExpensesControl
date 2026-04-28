const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const db = require('../db');
const auth = require('../middleware/auth');

// Configure VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};
webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_CONTACT_EMAIL || 'admin@expensescontrol.local'),
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

// GET /vapid-public-key — return the public key for the client
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// POST /subscribe — save push subscription
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, p256dh, auth: authToken } = req.body;

    if (!endpoint || !p256dh || !authToken) {
      return res.status(400).json({ error: 'endpoint, p256dh, and auth are required' });
    }

    // Upsert: if endpoint already exists, update; otherwise insert
    const existing = await db('push_subscriptions').where({ endpoint }).first();

    if (existing) {
      // Verify the subscription belongs to this user
      if (existing.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: This subscription does not belong to you' });
      }
      await db('push_subscriptions')
        .where({ endpoint })
        .update({ user_id: req.user.id, p256dh, auth: authToken, created_at: new Date() });
    } else {
      await db('push_subscriptions').insert({
        user_id: req.user.id,
        endpoint,
        p256dh,
        auth: authToken,
        created_at: new Date(),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /subscribe — unsubscribe
router.delete('/subscribe', auth, async (req, res) => {
  try {
    await db('push_subscriptions').where({ user_id: req.user.id }).del();
    res.json({ success: true });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /test — send test notification
router.post('/test', auth, async (req, res) => {
  try {
    const subscription = await db('push_subscriptions').where({ user_id: req.user.id }).first();

    if (!subscription) {
      return res.status(404).json({ error: 'No push subscription found' });
    }

    const payload = JSON.stringify({
      title: 'ExpensesControl',
      body: 'Test notification!',
      icon: '/vite.svg',
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      payload,
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Test notification error:', err);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

module.exports = router;
