const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Generate a random 8-character alphanumeric token
function generateToken() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8).toUpperCase();
}

router.use(auth);

// POST /invites/:groupId - Generate invite token
router.post('/:groupId', async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  try {
    // Check if user is a member of the group
    const member = await db('group_members')
      .where({ group_id: groupId, user_id: userId })
      .first();

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db('group_invites').insert({
      group_id: groupId,
      created_by: userId,
      token,
      expires_at: expiresAt,
      max_uses: 10,
      used_count: 0,
    });

    const baseUrl = process.env.APP_URL || 'https://expensescontrol.app';
    const inviteLink = `${baseUrl}/join/${groupId}?invite=${token}`;

    res.json({ inviteLink, token });
  } catch (err) {
    console.error('Create invite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /invites/validate - Check if token is valid
router.get('/validate', async (req, res) => {
  const { token, groupId } = req.query;

  if (!token || !groupId) {
    return res.status(400).json({ valid: false, error: 'Token and groupId are required' });
  }

  try {
    const invite = await db('group_invites')
      .where({ token, group_id: groupId })
      .first();

    if (!invite) {
      return res.json({ valid: false, error: 'Invalid invite link' });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return res.json({ valid: false, error: 'Invite link has expired' });
    }

    if (invite.used_count >= invite.max_uses) {
      return res.json({ valid: false, error: 'Invite link has reached max uses' });
    }

    const group = await db('groups').where({ id: groupId }).first();
    if (!group) {
      return res.json({ valid: false, error: 'Group not found' });
    }

    res.json({
      valid: true,
      group: { id: group.id, name: group.name, description: group.description },
    });
  } catch (err) {
    console.error('Validate invite error:', err);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

// POST /invites/join - Join group with invite token
router.post('/join', async (req, res) => {
  const { token, groupId } = req.body;
  const userId = req.user.id;

  if (!token || !groupId) {
    return res.status(400).json({ error: 'Token and groupId are required' });
  }

  try {
    const invite = await db('group_invites')
      .where({ token, group_id: groupId })
      .first();

    if (!invite) {
      return res.status(400).json({ error: 'Invalid invite link' });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invite link has expired' });
    }

    if (invite.used_count >= invite.max_uses) {
      return res.status(400).json({ error: 'Invite link has reached max uses' });
    }

    // Check if already a member
    const existing = await db('group_members')
      .where({ group_id: groupId, user_id: userId })
      .first();

    if (existing) {
      return res.status(409).json({ error: 'You are already a member of this group' });
    }

    // Add user to group
    await db('group_members').insert({ group_id: groupId, user_id: userId });

    // Increment used_count
    await db('group_invites')
      .where({ id: invite.id })
      .update({ used_count: invite.used_count + 1 });

    res.json({ success: true });
  } catch (err) {
    console.error('Join group error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
