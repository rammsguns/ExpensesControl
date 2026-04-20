const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/auth');

router.use(auth);

const VALID_SPLIT_TYPES = ['equal', 'percentage', 'exact', 'shares'];

router.post('/', async (req, res) => {
  const { description, amount, paidBy, splitType, splits, groupId } = req.body;

  // Input validation
  if (!groupId || !description || amount === undefined || !paidBy || !splitType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  if (!VALID_SPLIT_TYPES.includes(splitType)) {
    return res.status(400).json({ error: 'Invalid split type. Must be: equal, percentage, exact, or shares' });
  }

  if (splitType !== 'equal' && (!Array.isArray(splits) || splits.length === 0)) {
    return res.status(400).json({ error: 'Splits array is required for non-equal split types' });
  }

  if (splitType === 'percentage') {
    for (const s of splits) {
      if (typeof s.percentage !== 'number' || s.percentage < 0 || s.percentage > 100) {
        return res.status(400).json({ error: 'Each split percentage must be between 0 and 100' });
      }
    }
  }

  if (splitType === 'exact') {
    for (const s of splits) {
      if (typeof s.amount !== 'number' || s.amount < 0) {
        return res.status(400).json({ error: 'Each split amount must be a non-negative number' });
      }
    }
  }

  if (splitType === 'shares') {
    for (const s of splits) {
      if (typeof s.shares !== 'number' || s.shares <= 0) {
        return res.status(400).json({ error: 'Each split share must be a positive number' });
      }
    }
  }

  try {
    // Verify user is a member of the group
    const membership = await db('group_members')
      .where({ group_id: groupId, user_id: req.user.id })
      .first();
    if (!membership) {
      return res.status(403).json({ error: 'Forbidden: Not a member of this group' });
    }

    const isMember = await db('group_members')
      .where({ group_id: groupId, user_id: paidBy })
      .first();
    if (!isMember) return res.status(403).json({ error: 'Payer must be a member of the group' });

    const [expenseId] = await db('expenses').insert({
      group_id: groupId,
      description,
      amount,
      paid_by: paidBy,
      split_type: splitType
    });

    let expenseSplits = [];

    if (splitType === 'equal') {
      const members = await db('group_members')
        .where({ group_id: groupId })
        .join('users', 'group_members.user_id', 'users.id')
        .select('users.id');
      
      const share = parseFloat(amount) / members.length;
      expenseSplits = members.map(m => ({ expense_id: expenseId, user_id: m.id, amount: share }));
    } else if (splitType === 'percentage') {
      expenseSplits = splits.map(s => ({
        expense_id: expenseId,
        user_id: s.userId,
        amount: (s.percentage / 100) * parseFloat(amount)
      }));
    } else if (splitType === 'exact') {
      expenseSplits = splits.map(s => ({
        expense_id: expenseId,
        user_id: s.userId,
        amount: s.amount
      }));
    } else if (splitType === 'shares') {
      const totalShares = splits.reduce((sum, s) => sum + s.shares, 0);
      expenseSplits = splits.map(s => ({
        expense_id: expenseId,
        user_id: s.userId,
        amount: (s.shares / totalShares) * parseFloat(amount)
      }));
    }

    await db('expense_splits').insert(expenseSplits);

    res.status(201).json({ id: expenseId, message: 'Expense created' });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/group/:groupId', requireGroupMember, async (req, res) => {
  try {
    const expenses = await db('expenses')
      .where({ group_id: req.params.groupId })
      .orderBy('created_at', 'desc');
    
    const detailedExpenses = await Promise.all(expenses.map(async (exp) => {
      const splits = await db('expense_splits')
        .where({ expense_id: exp.id })
        .join('users', 'expense_splits.user_id', 'users.id')
        .select('users.id', 'users.name', 'expense_splits.amount as share_amount');
      const payer = await db('users').where({ id: exp.paid_by }).first();
      return { ...exp, splits, paid_by_name: payer?.name };
    }));

    res.json(detailedExpenses);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const expense = await db('expenses').where({ id: req.params.id }).first();
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    // Verify membership
    const membership = await db('group_members')
      .where({ group_id: expense.group_id, user_id: req.user.id })
      .first();
    if (!membership) {
      return res.status(403).json({ error: 'Forbidden: Not a member of this group' });
    }

    const splits = await db('expense_splits')
      .where({ expense_id: req.params.id })
      .join('users', 'expense_splits.user_id', 'users.id')
      .select('users.id', 'users.name', 'expense_splits.amount as share_amount');

    const payer = await db('users').where({ id: expense.paid_by }).first();
    res.json({ ...expense, splits, paid_by_name: payer?.name });
  } catch (err) {
    console.error('Get expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const expense = await db('expenses').where({ id: req.params.id }).first();
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    // Verify membership
    const membership = await db('group_members')
      .where({ group_id: expense.group_id, user_id: req.user.id })
      .first();
    if (!membership) {
      return res.status(403).json({ error: 'Forbidden: Not a member of this group' });
    }

    await db('expense_splits').where({ expense_id: req.params.id }).del();
    await db('expenses').where({ id: req.params.id }).del();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;