const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load .env file

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true
}));

// MongoDB connection
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, { retryWrites: true, w: 'majority' })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./auth');
const apiRoutes = require('./routes');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Authentication routes
app.use('/auth', authRoutes);

// API routes
app.use('/api', apiRoutes);

// Multi-tenancy routes
app.get('/uvu', (req, res) => {
    if (!req.session.user || req.session.user.tenant !== 'UVU') {
        return res.redirect('/auth/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'uvu.html'));
});

app.get('/uofu', (req, res) => {
    if (!req.session.user || req.session.user.tenant !== 'UofU') {
        return res.redirect('/auth/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'uofu.html'));
});

// Default route
app.get('/', (req, res) => res.redirect('/auth/login'));

// Start server
const PORT = 5500;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
