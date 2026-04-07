const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'aicyberx_secret';

// ─── Helper ────────────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

// ─── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, institution, grade, city, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required.' });

    const existing = db.prepare('SELECT id FROM students WHERE email = ?').get(email);
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const password_hash = await bcrypt.hash(password, 12);
    const avatarColors = ['#00d4ff', '#0077ff', '#00ff88', '#ff6b35', '#a855f7'];
    const avatar_color = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const result = db.prepare(`
      INSERT INTO students (name, email, phone, institution, grade, city, password_hash, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone || null, institution || null, grade || null, city || null, password_hash, avatar_color);

    const token = generateToken(result.lastInsertRowid);
    const student = db.prepare('SELECT id, name, email, phone, institution, grade, city, avatar_color, created_at FROM students WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ token, student, message: 'Welcome to AIcyberX! 🚀' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
    if (!student)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password.' });

    // Update last login
    db.prepare('UPDATE students SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(student.id);

    const token = generateToken(student.id);
    const { password_hash, ...safeStudent } = student;

    res.json({ token, student: safeStudent, message: `Welcome back, ${student.name}!` });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── GET /api/auth/profile ─────────────────────────────────────────────────────
router.get('/profile', require('../middleware/auth'), (req, res) => {
  try {
    const student = db.prepare(
      'SELECT id, name, email, phone, institution, grade, city, avatar_color, bio, created_at, last_login FROM students WHERE id = ?'
    ).get(req.userId);

    if (!student) return res.status(404).json({ error: 'Student not found.' });

    // Get registered workshops
    const workshops = db.prepare(`
      SELECT w.*, r.registered_at FROM workshops w
      JOIN registrations r ON w.id = r.workshop_id
      WHERE r.student_id = ?
      ORDER BY r.registered_at DESC
    `).all(req.userId);

    res.json({ student, workshops });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ─── PUT /api/auth/profile ─────────────────────────────────────────────────────
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, phone, institution, grade, city, bio } = req.body;
    db.prepare(`
      UPDATE students SET name=?, phone=?, institution=?, grade=?, city=?, bio=?
      WHERE id=?
    `).run(name, phone, institution, grade, city, bio, req.userId);

    const updated = db.prepare(
      'SELECT id, name, email, phone, institution, grade, city, avatar_color, bio FROM students WHERE id = ?'
    ).get(req.userId);

    res.json({ student: updated, message: 'Profile updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
