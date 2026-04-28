const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// POST /api/expenses/:id/receipt
router.post('/:id/receipt', auth, upload.single('receipt'), async (req, res) => {
  try {
    const expense = await db('expenses').where({ id: req.params.id }).first();
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    // Only creator or group member can upload
    const membership = await db('group_members')
      .where({ group_id: expense.group_id, user_id: req.user.id })
      .first();
    if (!membership) return res.status(403).json({ error: 'Not a member' });

    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    await db('expenses').where({ id: req.params.id }).update({ receipt_url: receiptUrl });

    res.json({ receiptUrl });
  } catch (err) {
    console.error('Receipt upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
