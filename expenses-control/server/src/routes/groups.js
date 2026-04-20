const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', async (req, res) => {
  const { name, description, type } = req.body;
  const creatorId = req.user.id;
  try {
    const [groupId] = await db('groups').insert({ name, description, type: type || 'other', created_by: creatorId });
    await db('group_members').insert({ group_id: groupId, user_id: creatorId });
    res.status(201).json({ id: groupId, name, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const groups = await db('groups')
      .join('group_members', 'groups.id', 'group_members.group_id')
      .where('group_members.user_id', req.user.id)
      .select('groups.*');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const group = await db('groups').where({ id: req.params.id }).first();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const members = await db('users')
      .join('group_members', 'users.id', 'group_members.user_id')
      .where('group_members.group_id', req.params.id)
      .select('users.id', 'users.name', 'users.email');

    res.json({ ...group, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/members', async (req, res) => {
  const { email } = req.body;
  const groupId = req.params.id;
  try {
    const member = await db('users').where({ email }).first();
    if (!member) return res.status(404).json({ error: 'User not found' });

    // Check if already a member
    const existing = await db('group_members')
      .where({ group_id: groupId, user_id: member.id })
      .first();
    if (existing) return res.status(409).json({ error: 'Already a member' });

    await db('group_members').insert({ group_id: groupId, user_id: member.id });
    res.status(201).json({ message: 'Member added', member: { id: member.id, name: member.name, email: member.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all friends (members from all user's groups, excluding self)
router.get('/friends/all', async (req, res) => {
  try {
    const userGroups = await db('group_members')
      .where('user_id', req.user.id)
      .select('group_id');
    const groupIds = userGroups.map(g => g.group_id);

    if (groupIds.length === 0) return res.json([]);

    const members = await db('group_members')
      .whereIn('group_id', groupIds)
      .join('users', 'group_members.user_id', 'users.id')
      .whereNot('users.id', req.user.id)
      .select('users.id', 'users.name', 'users.email')
      .groupBy('users.id');

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/members/:userId', async (req, res) => {
  try {
    await db('group_members').where({ group_id: req.params.id, user_id: req.params.userId }).del();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;