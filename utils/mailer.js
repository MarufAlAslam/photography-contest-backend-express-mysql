const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // or your SMTP provider (e.g., smtp-relay.sendinblue.com for Brevo)
    port: 587,
    secure: false, // true for port 465
    auth: {
        user: process.env.SMTP_USER, // your email address
        pass: process.env.SMTP_PASS  // your email password or app password
    }
});

module.exports = transporter;
