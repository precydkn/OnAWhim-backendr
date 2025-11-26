const express = require('express');
const router = express.Router();
const Activity = require('../models/activity');
const auth = require('../middleware/auth');

// --- Get all activities for logged-in user ---
router.get('/', auth, async (req, res) => {
    try {
        const activities = await Activity.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ---

// --- Add new activity ---
router.post('/', auth, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Activity name is required.' });

    try {
        // prevent duplicate activity for the same user
        const exists = await Activity.findOne({ user: req.user._id, name });
        if (exists) return res.status(400).json({ error: 'Activity is already in your list :]' });

        const newActivity = new Activity({ user: req.user._id, name });
        await newActivity.save();

        res.status(201).json({
            _id: newActivity._id,
            name: newActivity.name,
            status: newActivity.status,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ---

// --- Update activity status ---
router.patch('/:id', auth, async (req, res) => {
    const { status } = req.body;
    if (!['undone', 'done'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    try {
        const activity = await Activity.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { status, completedAt: status === 'done' ? new Date() : null },
            { new: true }
        );
        if (!activity) return res.status(404).json({ error: 'Activity not found.' });
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ---

// --- Delete an activity ---
router.delete('/:id', auth, async (req, res) => {
    try {
        const activity = await Activity.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!activity) return res.status(404).json({ error: 'Activity not found.' });
        res.json({ message: 'Activity deleted.', id: activity._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ---

module.exports = router;