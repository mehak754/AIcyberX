const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { Student, Registration, Workshop } = require('../database');

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

    const existing = await Student.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const password_hash = await bcrypt.hash(password, 12);
    const avatarColors  = ['#00d4ff', '#0077ff', '#00ff88', '#ff6b35', '#a855f7'];
    const avatar_color  = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const student = await Student.create({
      name, email, phone: phone || null, institution: institution || null,
      grade: grade || null, city: city || null, password_hash, avatar_color,
    });

    const token    = generateToken(student._id);
    const safeData = student.toJSON();
    delete safeData.password_hash;

    res.status(201).json({ token, student: safeData, message: 'Welcome to AIcyberX! 🚀' });
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

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password.' });

    // Update last login
    student.last_login = new Date();
    await student.save();

    const token    = generateToken(student._id);
    const safeData = student.toJSON();
    delete safeData.password_hash;

    res.json({ token, student: safeData, message: `Welcome back, ${student.name}!` });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── GET /api/auth/profile ─────────────────────────────────────────────────────
router.get('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const student = await Student.findById(req.userId).select('-password_hash');
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    // Get registered workshops with workshop details
    const registrations = await Registration.find({ student_id: req.userId })
      .populate('workshop_id')
      .sort({ registered_at: -1 });

    const workshops = registrations
      .filter(r => r.workshop_id) // guard against deleted workshops
      .map(r => ({
        ...r.workshop_id.toJSON(),
        registered_at: r.registered_at,
      }));

    res.json({ student: student.toJSON(), workshops });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ─── PUT /api/auth/profile ─────────────────────────────────────────────────────
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, phone, institution, grade, city, bio } = req.body;

    const updated = await Student.findByIdAndUpdate(
      req.userId,
      { name, phone, institution, grade, city, bio },
      { new: true, runValidators: true, select: '-password_hash' }
    );

    if (!updated) return res.status(404).json({ error: 'Student not found.' });

    res.json({ student: updated.toJSON(), message: 'Profile updated successfully!' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
