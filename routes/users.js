const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Activity = require('../models/activity');
const jwt = require('jsonwebtoken'); //to create and verify tokens

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Create a new user
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email and password required." });

    try {
        const newUser = new User({ email, password });
        await newUser.save();

        // generate token (expires after 30 days)
        const token = jwt.sign({ _id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({ _id: newUser._id, email: newUser.email, token });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "User already exists." });
        }
        res.status(400).json({ error: error.message });
    }
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a user
router.put('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a user and their activities
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // delete user
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        
        // delete all activities for this user
        await Activity.deleteMany({ user: userId });

        res.json({ message: 'User and all activities deleted.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;