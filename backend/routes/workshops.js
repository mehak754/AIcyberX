const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

// ─── GET /api/workshops ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { category, featured } = req.query;
    let query = 'SELECT * FROM workshops WHERE is_active = 1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (featured === 'true') {
      query += ' AND is_featured = 1';
    }

    query += ' ORDER BY date ASC, created_at DESC';
    const workshops = db.prepare(query).all(...params);
    res.json(workshops);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workshops.' });
  }
});

// ─── GET /api/workshops/:id ────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const workshop = db.prepare('SELECT * FROM workshops WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!workshop) return res.status(404).json({ error: 'Workshop not found.' });

    const seats_left = workshop.seats_total - workshop.seats_filled;
    res.json({ ...workshop, seats_left });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workshop.' });
  }
});

// ─── POST /api/workshops/:id/register ─────────────────────────────────────────
router.post('/:id/register', authMiddleware, (req, res) => {
  try {
    const workshopId = parseInt(req.params.id);
    const studentId = req.userId;

    const workshop = db.prepare('SELECT * FROM workshops WHERE id = ? AND is_active = 1').get(workshopId);
    if (!workshop) return res.status(404).json({ error: 'Workshop not found.' });

    const seats_left = workshop.seats_total - workshop.seats_filled;
    if (seats_left <= 0) return res.status(400).json({ error: 'This workshop is fully booked.' });

    const existing = db.prepare('SELECT id FROM registrations WHERE student_id = ? AND workshop_id = ?').get(studentId, workshopId);
    if (existing) return res.status(409).json({ error: 'You are already registered for this workshop!' });

    db.prepare('INSERT INTO registrations (student_id, workshop_id) VALUES (?, ?)').run(studentId, workshopId);
    db.prepare('UPDATE workshops SET seats_filled = seats_filled + 1 WHERE id = ?').run(workshopId);

    res.status(201).json({ message: `Successfully registered for "${workshop.title}"! 🎉` });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

module.exports = router;
