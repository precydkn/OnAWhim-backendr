const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const bodyParser = require('body-parser');
const path = require('path');
const User = require('./models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

const app = express();
const port = 3300;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/onawhim')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
const users = require('./routes/users');
app.use('/users', users);

// Admin routes
// app.use('/admin', auth, express.static(path.join(__dirname, '../frontend/admin')));

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email and password required." });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User does not exist." });

        // check password
        if (password !== user.password) {
            return res.status(400).json({ error: "Incorrect password." });
        }

        // generate token (to get and track activties)
        const token = jwt.sign({ _id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ _id: user._id, email: user.email, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Activity routes ---
const activities = require('./routes/activities');
app.use('/activities', activities);

// --- Bored API route ---
app.get('/api/activity', async (req, res) => {
    const { type } = req.query;
    const url = `https://bored-api.appbrewery.com/filter?type=${type}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Bored API error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching from Bored API:', error.message);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});
// ---

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});