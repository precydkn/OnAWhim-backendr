require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const bodyParser = require('body-parser');
const User = require('./models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // for user token
const FRONTEND_URL = process.env.FRONTEND_URL; // oaw render frontend
const MONGODB_URI = process.env.MONGODB_URI; // atlas connection string

const app = express();
const port = process.env.PORT || 3300; // for render port

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: [
        FRONTEND_URL || "https://onawhim.onrender.com", // deployed frontend
        "http://localhost:5173" // local dev
    ],
    credentials: true
}));

// MongoDB connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err  => {
        console.error("MongoDB connection failed:", err);
        process.exit(1); // immediately stop backend
    });

// Routes
const users = require('./routes/users');
app.use('/users', users);

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

// --- Activity route ---
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