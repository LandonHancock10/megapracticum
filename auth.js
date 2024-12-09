const express = require('express');
const bcrypt = require('bcrypt'); // Import bcrypt
const router = express.Router();
const path = require('path');
const User = require('./models/User');

// Login route
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });

        // If user not found or password doesn't match
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid credentials');
        }

        // Set user session
        req.session.user = user;

        // Redirect based on tenant
        const redirectUrl = user.tenant === 'UVU' ? '/uvu' : '/uofu';
        return res.redirect(redirectUrl);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal server error');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = router;
