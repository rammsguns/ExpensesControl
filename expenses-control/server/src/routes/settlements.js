const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', async (req, res) => {
  const { groupId, fromUserId, toUserId, amount } = req.body;
  try {
    const [id] = await db('settlements').insert({
      group_id: groupId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount
    });
    res.status(201).json({ id, message: 'Settlement recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/group/:groupId', async (req, res) => {
  try {
    const settlements = await db('settlements')
      .where({ group_id: req.params.groupId })
      .join('users as from_user', 'settlements.from_user_id', 'from_user.id')
      .join('users as to_user', 'settlements.to_user_id', 'to_user.id')
      .select('settlements.*', 'from_user.name as from_name', 'to_user.name as to_name');
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/group/:groupId/plan', async (req, res) => {
  try {
    const settlements = await db('settlements').where({ group_id: req.params.groupId });
    
    // Debt simplification algorithm (simplified version)
    // 1. Calculate net balances for everyone in the group
    const members = await db('group_members')
      .where({ group_id: req.params.groupId })
      .select('user_id');
    
    const netBalances = {};
    members.forEach(m => netBalances[m.user_id] = 0);

    // Add expenses
    const expenses = await db('expenses').where({ group_id: req.params.groupId });
    for (const exp of expenses) {
      const splits = await db('expense_splits').where({ expense_id: exp.id });
      // Payer gets credit
      netBalances[exp.paid_by] += parseFloat(exp.amount);
      // Debtors get debited
      for (const split of splits) {
        netBalances[split.user_id] -= parseFloat(split.amount);
      }
    }

    // Add settlements (from pays to: from gets +balance credit, to gets -balance debit)
    for (const set of settlements) {
      netBalances[set.from_user_id] += parseFloat(set.amount);
      netBalances[set.to_user_id] -= parseFloat(set.amount);
    }

    // 2. Create a list of creditors and debtors
    const creditors = [];
    const debtors = [];
    for (const userId in netBalances) {
      if (netBalances[userId] > 0.01) creditors.push({ id: userId, amount: netBalances[userId] });
      else if (netBalances[userId] < -0.01) debtors.push({ id: userId, amount: Math.abs(netBalances[userId]) });
    }

    // 3. Match them up
    // Get user names
    const userMap = {};
    const allUsers = await db('users').select('id', 'name');
    allUsers.forEach(u => userMap[u.id] = u.name);

    const plan = [];
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const payAmount = Math.min(creditors[i].amount, debtors[j].amount);
      plan.push({ from: debtors[j].id, fromName: userMap[debtors[j].id], to: creditors[i].id, toName: userMap[creditors[i].id], amount: payAmount });
      
      creditors[i].amount -= payAmount;
      debtors[j].amount -= payAmount;

      if (creditors[i].amount <= 0.01) i++;
      if (debtors[j].amount <= 0.01) j++;
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
