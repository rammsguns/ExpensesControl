const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', async (req, res) => {
  const { description, amount, paidBy, splitType, splits, groupId } = req.body;

  if (!groupId || !description || !amount || !paidBy || !splitType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/group/:groupId', async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const expense = await db('expenses').where({ id: req.params.id }).first();
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const splits = await db('expense_splits')
      .where({ expense_id: req.params.id })
      .join('users', 'expense_splits.user_id', 'users.id')
      .select('users.id', 'users.name', 'expense_splits.amount as share_amount');

    const payer = await db('users').where({ id: expense.paid_by }).first();
    res.json({ ...expense, splits, paid_by_name: payer?.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db('expense_splits').where({ expense_id: req.params.id }).del();
    await db('expenses').where({ id: req.params.id }).del();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;