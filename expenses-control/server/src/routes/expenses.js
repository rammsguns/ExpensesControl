const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/auth');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitize = (text) => (typeof text === 'string' ? DOMPurify.sanitize(text) : text);

// GET /search — Search expenses with filters
router.get('/search', async (req, res) => {
  const { q, groupId, startDate, endDate, minAmount, maxAmount, splitType } = req.query;

  try {
    const userGroups = await db('group_members')
      .where({ user_id: req.user.id })
      .select('group_id');
    const allowedGroupIds = userGroups.map(g => g.group_id);

    let query = db('expenses')
      .join('users', 'expenses.paid_by', 'users.id')
      .whereIn('expenses.group_id', allowedGroupIds)
      .select('expenses.*', 'users.name as paid_by_name');

    if (groupId) {
      const parsedGroupId = parseInt(groupId);
      if (!allowedGroupIds.includes(parsedGroupId)) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }
      query = query.where('expenses.group_id', parsedGroupId);
    }

    if (q) {
      const searchTerm = `%${q}%`;
      query = query.where(function() {
        this.where('expenses.description', 'like', searchTerm)
          .orWhere('users.name', 'like', searchTerm);
      });
    }

    if (startDate) query = query.where('expenses.created_at', '>=', new Date(startDate));
    if (endDate) query = query.where('expenses.created_at', '<=', new Date(endDate));
    if (minAmount) query = query.where('expenses.amount', '>=', parseFloat(minAmount));
    if (maxAmount) query = query.where('expenses.amount', '<=', parseFloat(maxAmount));
    if (splitType) query = query.where('expenses.split_type', splitType);

    const expenses = await query.orderBy('expenses.created_at', 'desc');

    const detailedExpenses = await Promise.all(expenses.map(async (exp) => {
      const splits = await db('expense_splits')
        .where({ expense_id: exp.id })
        .join('users', 'expense_splits.user_id', 'users.id')
        .select('users.id', 'users.name', 'expense_splits.amount as share_amount');
      return { ...exp, splits };
    }));

    res.json(detailedExpenses);
  } catch (err) {
    console.error('Search expenses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create new expense
router.post('/', requireGroupMember, async (req, res) => {
  const { groupId, description, amount, paidBy, splitType, splits } = req.body;

  try {
    // Validate input
    if (!groupId || !description || !amount || !paidBy || !splitType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!VALID_SPLIT_TYPES.includes(splitType)) {
      return res.status(400).json({ error: 'Invalid split type' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Verify user is a member of the group
    const membership = await db('group_members')
      .where({ group_id: groupId, user_id: req.user.id })
      .first();
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Create expense
    const [expenseId] = await db('expenses').insert({
      group_id: groupId,
      description: sanitize(description),
      amount: parsedAmount,
      paid_by: paidBy,
      split_type: splitType
    });

    // Create splits
    let expenseSplits = [];
    const members = await db('group_members')
      .where({ group_id: groupId })
      .join('users', 'group_members.user_id', 'users.id')
      .select('users.id');

    if (splitType === 'equal') {
      const share = parsedAmount / members.length;
      expenseSplits = members.map(m => ({ expense_id: expenseId, user_id: m.id, amount: share }));
    } else if (splitType === 'percentage') {
      expenseSplits = splits.map(s => ({
        expense_id: expenseId,
        user_id: s.userId,
        amount: (s.percentage / 100) * parsedAmount
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
        amount: (s.shares / totalShares) * parsedAmount
      }));
    }

    await db('expense_splits').insert(expenseSplits);

    res.status(201).json({ id: expenseId, message: 'Expense created' });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { description, amount, paidBy, paid_by, splitType, splits } = req.body;
  const expenseId = req.params.id;

  try {
    const expense = await db('expenses').where({ id: expenseId }).first();
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    // Verify user is the creator (paid_by === req.user.id)
    if (expense.paid_by !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You are not the creator of this expense' });
    }

    // Handle both paidBy and paid_by from frontend
    const finalPaidBy = paidBy || paid_by;
    
    // Parse amount - could be string from JSON
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Input validation
    if (!description || parsedAmount === undefined || !finalPaidBy || !splitType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof parsedAmount !== 'number' || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (!VALID_SPLIT_TYPES.includes(splitType)) {
      return res.status(400).json({ error: 'Invalid split type. Must be: equal, percentage, exact, or shares' });
    }

    if (splitType !== 'equal' && (!Array.isArray(splits) || splits.length === 0)) {
      return res.status(400).json({ error: 'Splits array is required for non-equal split types' });
    }

    // Validate splits based on type
    if (splitType === 'percentage') {
      const totalPct = splits.reduce((sum, s) => {
        const pct = typeof s.percentage === 'string' ? parseFloat(s.percentage) : s.percentage;
        return sum + (pct || 0);
      }, 0);
      if (Math.abs(totalPct - 100) > 0.1) {
        return res.status(400).json({ error: `Percentages must sum to 100%, got ${totalPct.toFixed(1)}%` });
      }
    }

    if (splitType === 'exact') {
      const totalExact = splits.reduce((sum, s) => {
        const amt = typeof s.amount === 'string' ? parseFloat(s.amount) : s.amount;
        return sum + (amt || 0);
      }, 0);
      if (Math.abs(totalExact - parsedAmount) > 0.01) {
        return res.status(400).json({ error: `Exact amounts must sum to total amount MX$${parsedAmount.toFixed(2)}` });
      }
    }

    // Update expense
    await db('expenses').where({ id: expenseId }).update({
      description: sanitize(description),
      amount: parsedAmount,
      paid_by: finalPaidBy,
      split_type: splitType
    });

    // Delete old splits and recalculate
    await db('expense_splits').where({ expense_id: expenseId }).del();

    let expenseSplits = [];
    const groupId = expense.group_id;

    if (splitType === 'equal') {
      const members = await db('group_members')
        .where({ group_id: groupId })
        .join('users', 'group_members.user_id', 'users.id')
        .select('users.id');
      
      const share = parsedAmount / members.length;
      expenseSplits = members.map(m => ({ expense_id: expenseId, user_id: m.id, amount: share }));
    } else if (splitType === 'percentage') {
      expenseSplits = splits.map(s => ({
        expense_id: expenseId,
        user_id: s.userId,
        amount: ((typeof s.percentage === 'string' ? parseFloat(s.percentage) : s.percentage) / 100) * parsedAmount
      }));
    } else if (splitType === 'exact') {
      expenseSplits = splits.map(s => ({
        expense_id: expenseId,
        user_id: s.userId,
        amount: typeof s.amount === 'string' ? parseFloat(s.amount) : s.amount
      }));
    } else if (splitType === 'shares') {
      const totalShares = splits.reduce((sum, s) => sum + (typeof s.shares === 'string' ? parseFloat(s.shares) : s.shares), 0);
      expenseSplits = splits.map(s => ({
        expense_id: expenseId,
        user_id: s.userId,
        amount: ((typeof s.shares === 'string' ? parseFloat(s.shares) : s.shares) / totalShares) * parsedAmount
      }));
    }

    await db('expense_splits').insert(expenseSplits);

    res.json({ id: expenseId, message: 'Expense updated' });
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search', async (req, res) => {
  const { q, groupId, startDate, endDate, minAmount, maxAmount, splitType } = req.query;

  try {
    // Get all groups the user belongs to
    const userGroups = await db('group_members')
      .where({ user_id: req.user.id })
      .select('group_id');
    const groupIds = userGroups.map(g => g.group_id);

    if (groupIds.length === 0) {
      return res.json([]);
    }

    let query = db('expenses')
      .whereIn('group_id', groupIds)
      .orderBy('created_at', 'desc');

    // Filter by specific group
    if (groupId) {
      const gid = parseInt(groupId);
      if (!groupIds.includes(gid)) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }
      query = query.where({ group_id: gid });
    }

    // Search by description (case-insensitive)
    if (q) {
      query = query.where('description', 'like', `%${q}%`);
    }

    // Date range filter
    if (startDate) {
      query = query.where('created_at', '>=', `${startDate} 00:00:00`);
    }
    if (endDate) {
      query = query.where('created_at', '<=', `${endDate} 23:59:59`);
    }

    // Amount range filter
    if (minAmount) {
      query = query.where('amount', '>=', parseFloat(minAmount));
    }
    if (maxAmount) {
      query = query.where('amount', '<=', parseFloat(maxAmount));
    }

    // Split type filter
    if (splitType) {
      query = query.where({ split_type: splitType });
    }

    const expenses = await query;

    // Fetch details for each expense
    const detailedExpenses = await Promise.all(expenses.map(async (exp) => {
      const splits = await db('expense_splits')
        .where({ expense_id: exp.id })
        .join('users', 'expense_splits.user_id', 'users.id')
        .select('users.id', 'users.name', 'expense_splits.amount as share_amount');
      const payer = await db('users').where({ id: exp.paid_by }).first();
      const group = await db('groups').where({ id: exp.group_id }).first();
      return {
        ...exp,
        splits,
        paid_by_name: payer?.name,
        group_name: group?.name
      };
    }));

    res.json(detailedExpenses);
  } catch (err) {
    console.error('Search expenses error:', err);
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

    // Verify user is the creator (or group admin)
    if (expense.paid_by !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Only the expense creator can delete' });
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