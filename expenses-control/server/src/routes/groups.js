const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { requireGroupMember, requireGroupCreator } = require('../middleware/auth');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitize = (text) => (typeof text === 'string' ? DOMPurify.sanitize(text) : text);

router.use(auth);

router.post('/', async (req, res) => {
  const { name, description, type } = req.body;
  const creatorId = req.user.id;
  try {
    const [groupId] = await db('groups').insert({ 
      name: sanitize(name), 
      description: sanitize(description), 
      type: type || 'other', 
      created_by: creatorId 
    });
    await db('group_members').insert({ group_id: groupId, user_id: creatorId });
    res.status(201).json({ id: groupId, name, description });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error('Get groups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireGroupMember, async (req, res) => {
  try {
    const group = await db('groups').where({ id: req.params.id }).first();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const members = await db('users')
      .join('group_members', 'users.id', 'group_members.user_id')
      .where('group_members.group_id', req.params.id)
      .select('users.id', 'users.name', 'users.email');

    res.json({ ...group, members });
  } catch (err) {
    console.error('Get group error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/members', requireGroupMember, async (req, res) => {
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
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error('Get friends error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/members/:userId', requireGroupCreator, async (req, res) => {
  try {
    // Don't allow removing the creator
    const group = await db('groups').where({ id: req.params.id }).first();
    if (parseInt(req.params.userId) === group.created_by) {
      return res.status(400).json({ error: 'Cannot remove the group creator' });
    }

    await db('group_members').where({ group_id: req.params.id, user_id: req.params.userId }).del();
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;