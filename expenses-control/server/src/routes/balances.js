const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /group/:groupId — balances for a specific group
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    // Verify membership
    const member = await db('group_members')
      .where({ group_id: groupId, user_id: userId })
      .first();
    if (!member) return res.status(403).json({ error: 'Not a member of this group' });

    // Get all members
    const members = await db('group_members')
      .where({ group_id: groupId })
      .join('users', 'group_members.user_id', 'users.id')
      .select('users.id', 'users.name');

    const balances = {};
    members.forEach(m => { balances[m.id] = { userId: m.id, name: m.name, balance: 0 }; });

    // Process expenses
    const expenses = await db('expenses').where({ group_id: groupId });
    for (const exp of expenses) {
      // Payer gets +amount
      if (balances[exp.paid_by] !== undefined) {
        balances[exp.paid_by].balance += parseFloat(exp.amount);
      }

      // Each split person gets -their share
      const splits = await db('expense_splits').where({ expense_id: exp.id });
      for (const split of splits) {
        if (balances[split.user_id] !== undefined) {
          balances[split.user_id].balance -= parseFloat(split.amount);
        }
      }
    }

    // Process settlements
    const settlements = await db('settlements').where({ group_id: groupId });
    for (const s of settlements) {
      // from_user pays to_user: from_user balance +, to_user balance -
      if (balances[s.from_user_id] !== undefined) {
        balances[s.from_user_id].balance += parseFloat(s.amount);
      }
      if (balances[s.to_user_id] !== undefined) {
        balances[s.to_user_id].balance -= parseFloat(s.amount);
      }
    }

    res.json(Object.values(balances));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET / — total balances across all user's groups
router.get('/', async (req, res) => {
  const userId = req.user.id;

  try {
    // Get all groups for user
    const groupMemberships = await db('group_members')
      .where({ user_id: userId })
      .select('group_id');

    const groupIds = groupMemberships.map(gm => gm.group_id);
    const allBalances = {};

    for (const groupId of groupIds) {
      const members = await db('group_members')
        .where({ group_id: groupId })
        .join('users', 'group_members.user_id', 'users.id')
        .select('users.id', 'users.name');

      for (const m of members) {
        if (!allBalances[m.id]) {
          allBalances[m.id] = { userId: m.id, name: m.name, balance: 0 };
        }
      }

      const expenses = await db('expenses').where({ group_id: groupId });
      for (const exp of expenses) {
        if (allBalances[exp.paid_by]) {
          allBalances[exp.paid_by].balance += parseFloat(exp.amount);
        }
        const splits = await db('expense_splits').where({ expense_id: exp.id });
        for (const split of splits) {
          if (allBalances[split.user_id]) {
            allBalances[split.user_id].balance -= parseFloat(split.amount);
          }
        }
      }

      const settlements = await db('settlements').where({ group_id: groupId });
      for (const s of settlements) {
        if (allBalances[s.from_user_id]) {
          allBalances[s.from_user_id].balance += parseFloat(s.amount);
        }
        if (allBalances[s.to_user_id]) {
          allBalances[s.to_user_id].balance -= parseFloat(s.amount);
        }
      }
    }

    res.json(Object.values(allBalances));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;