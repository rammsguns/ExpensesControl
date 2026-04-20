const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async (req, res, next) => {
  try {
    // Read token from HttpOnly cookie first, fall back to Authorization header
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await db('users').where({ id: payload.id }).first();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Middleware to check group membership
module.exports.requireGroupMember = async (req, res, next) => {
  try {
    const groupId = req.params.id || req.params.groupId || req.body.groupId;
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID required' });
    }

    const member = await db('group_members')
      .where({ group_id: groupId, user_id: req.user.id })
      .first();

    if (!member) {
      return res.status(403).json({ error: 'Forbidden: Not a member of this group' });
    }

    next();
  } catch (err) {
    console.error('Group membership check error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check group creator (for admin actions like removing members)
module.exports.requireGroupCreator = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID required' });
    }

    const group = await db('groups').where({ id: groupId }).first();
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Only the group creator can do this' });
    }

    next();
  } catch (err) {
    console.error('Group creator check error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};