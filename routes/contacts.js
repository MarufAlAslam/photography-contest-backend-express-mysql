const express = require('express');
const db = require('../models/db');
const transporter = require('../utils/mailer');


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


        // Send email to admin
        await transporter.sendMail({
            from: `"Contact Form" <${process.env.SMTP_USER}>`,
            to: process.env.ADMIN_EMAIL, // Admin email
            subject: "New Contact Form Submission",
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>First Name:</strong> ${firstName}</p>
                <p><strong>Last Name:</strong> ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mobile:</strong> ${mobile}</p>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        });

        res.status(201).json({ message: 'Contact form submitted successfully!' });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
