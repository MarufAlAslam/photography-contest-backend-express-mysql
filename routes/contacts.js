const express = require('express');
const db = require('../models/db');

const router = express.Router();

// Submit Contact Form
router.post('/', async (req, res) => {
    const { firstName, lastName, email, mobile, address, message } = req.body;

    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'First name, email, and message are required!' });
    }

    try {
        await db.query(
            'INSERT INTO contacts (firstName, lastName, email, mobile, address, message) VALUES (?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, mobile, address, message]
        );

        res.status(201).json({ message: 'Contact form submitted successfully!' });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
