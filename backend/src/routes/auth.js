const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, resetUserData } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  try {
    const { name, email, password, business_name, business_phone, business_address, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password, business_name, business_phone, business_address, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      email.toLowerCase().trim(),
      hashedPassword,
      business_name || `${name.trim()}'s Freelance Studio`,
      business_phone || '',
      business_address || '',
      currency || 'USD'
    );

    const newUser = db.prepare('SELECT id, name, email, business_name, business_phone, business_address, currency, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error while creating account.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const userSafe = {
      id: user.id,
      name: user.name,
      email: user.email,
      business_name: user.business_name,
      business_phone: user.business_phone,
      business_address: user.business_address,
      currency: user.currency,
      created_at: user.created_at
    };

    res.json({
      message: 'Welcome back!',
      token,
      user: userSafe
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error while logging in.' });
  }
});

// POST /api/auth/demo-login
router.post('/demo-login', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('alex@paytrack.dev');
    if (!user) {
      return res.status(404).json({ error: 'Demo account not initialized.' });
    }

    const token = generateToken(user);
    const userSafe = {
      id: user.id,
      name: user.name,
      email: user.email,
      business_name: user.business_name,
      business_phone: user.business_phone,
      business_address: user.business_address,
      currency: user.currency,
      created_at: user.created_at,
      isDemo: true
    };

    res.json({
      message: 'Logged in to Demo Freelancer account!',
      token,
      user: userSafe
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Could not log in to demo account.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, business_name, business_phone, business_address, currency, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user, isDemo: user.email === 'alex@paytrack.dev' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { name, business_name, business_phone, business_address, currency } = req.body;
    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          business_name = COALESCE(?, business_name),
          business_phone = COALESCE(?, business_phone),
          business_address = COALESCE(?, business_address),
          currency = COALESCE(?, currency)
      WHERE id = ?
    `).run(name, business_name, business_phone, business_address, currency, req.user.id);

    const updated = db.prepare('SELECT id, name, email, business_name, business_phone, business_address, currency, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Profile updated successfully!', user: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/auth/reset-demo
router.post('/reset-demo', authMiddleware, (req, res) => {
  try {
    resetUserData(req.user.id);
    res.json({ message: 'Demo data has been reset to initial state with fresh metrics!' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset demo data.' });
  }
});

module.exports = router;
