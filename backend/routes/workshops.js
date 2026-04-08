const express = require('express');
const router  = express.Router();
const { Workshop, Registration } = require('../database');
const authMiddleware = require('../middleware/auth');

// ─── GET /api/workshops ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;
    const filter = { is_active: true };

    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.is_featured = true;

    const workshops = await Workshop.find(filter).sort({ date: 1, createdAt: -1 });
    res.json(workshops);
  } catch (err) {
    console.error('Workshops fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch workshops.' });
  }
});

// ─── GET /api/workshops/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const workshop = await Workshop.findOne({ _id: req.params.id, is_active: true });
    if (!workshop) return res.status(404).json({ error: 'Workshop not found.' });

    const seats_left = workshop.seats_total - workshop.seats_filled;
    res.json({ ...workshop.toJSON(), seats_left });
  } catch (err) {
    // Handle invalid ObjectId format
    if (err.name === 'CastError')
      return res.status(404).json({ error: 'Workshop not found.' });
    res.status(500).json({ error: 'Failed to fetch workshop.' });
  }
});

// ─── POST /api/workshops/:id/register ─────────────────────────────────────────
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const workshopId = req.params.id;
    const studentId  = req.userId;

    const workshop = await Workshop.findOne({ _id: workshopId, is_active: true });
    if (!workshop) return res.status(404).json({ error: 'Workshop not found.' });

    const seats_left = workshop.seats_total - workshop.seats_filled;
    if (seats_left <= 0)
      return res.status(400).json({ error: 'This workshop is fully booked.' });

    const existing = await Registration.findOne({ student_id: studentId, workshop_id: workshopId });
    if (existing)
      return res.status(409).json({ error: 'You are already registered for this workshop!' });

    await Registration.create({ student_id: studentId, workshop_id: workshopId });
    await Workshop.findByIdAndUpdate(workshopId, { $inc: { seats_filled: 1 } });

    res.status(201).json({ message: `Successfully registered for "${workshop.title}"! 🎉` });
  } catch (err) {
    if (err.name === 'CastError')
      return res.status(404).json({ error: 'Workshop not found.' });
    // Handle duplicate key (race condition — already registered)
    if (err.code === 11000)
      return res.status(409).json({ error: 'You are already registered for this workshop!' });
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

module.exports = router;
