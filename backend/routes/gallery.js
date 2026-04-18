const express = require('express');
const router = express.Router();

// TEMP dummy (you can connect DB later)

// GET all
router.get('/', async (req, res) => {
    res.json([]);
});

// GET one
router.get('/:id', async (req, res) => {
    res.json({ id: req.params.id });
});

module.exports = router;