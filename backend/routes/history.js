const express = require('express');
const router = express.Router();
const History = require('../models/History');
const { authMiddleware } = require('../middleware/auth'); //

// Get all history for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const history = await History.find({ userId: req.user.id });
    res.json(history);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Add a new history entry
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { correctedText } = req.body;
    const newHistory = new History({ userId: req.user.id, correctedText });
    await newHistory.save();
    res.json(newHistory);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete a specific history entry
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await History.findByIdAndDelete(req.params.id);
    res.json({ msg: 'History entry deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Clear all history for a user
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await History.deleteMany({ userId: req.user.id }); // Use the correct model
    res.status(200).json({ msg: 'History cleared successfully' });
  } catch (err) {
    console.error('Error clearing history:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});







module.exports = router;
