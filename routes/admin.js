const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { authenticateAdmin } = require('../middlewares/adminMiddleware');
const transporter = require('../utils/mailer');


const router = express.Router();
const saltRounds = 10;

// Admin Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [admin] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
        if (admin.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, admin[0].password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: admin[0].id, email: admin[0].email, isAdmin: true },
            process.env.JWT_SECRET,
            // { expiresIn: '1h' }
        );

        res.json({ token, admin: { id: admin[0].id, name: admin[0].name, email: admin[0].email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add New Admin - Protected
router.post('/add', authenticateAdmin, async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
        await db.query('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        // Send welcome email to admin
        await transporter.sendMail({
            from: `"Your App Admin Panel" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Welcome to Admin Panel",
            html: `
                <h3>Hi ${name},</h3>
                <p>You’ve been added as an administrator to our platform.</p>
                <p>You can now login and manage the system.</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> (the one you set)</p>
                <br />
                <p>Best Regards,<br>Your Team</p>
            `
        });

        res.status(201).json({ message: 'Admin added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// View All Photos - Protected
router.get('/photos', authenticateAdmin, async (req, res) => {
    try {
        const [photos] = await db.query('SELECT * FROM photos');
        res.json(photos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Approve Photos - Protected
// router.put('/approve/:id', authenticateAdmin, async (req, res) => {
//     const { id } = req.params;

//     try {
//         await db.query('UPDATE photos SET approved = 1 WHERE id = ?', [id]);
//         res.json({ message: 'Photo approved successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// Reject Photos - Protected
router.put('/reject/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('UPDATE photos SET approved = 0 WHERE id = ?', [id]);
        res.json({ message: 'Photo rejected successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete Photos - Protected
router.delete('/delete/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('DELETE FROM photos WHERE id = ?', [id]);
        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Choose Best Photos - Protected
router.put('/best/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('UPDATE photos SET best_photo = 1 WHERE id = ?', [id]);
        res.json({ message: 'Photo marked as best successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all contacts (Admin only)
router.get('/contact', authenticateAdmin, async (req, res) => {
    try {
        const [contacts] = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// change admin password
router.put('/change-password', authenticateAdmin, async (req, res) => {
    const { password, newPassword } = req.body;

    try {
        const [admin] = await db.query('SELECT * FROM admins WHERE id = ?', [req.user.id]); // req.user.id comes from the access_token
        if (admin.length === 0) return res.status(404).json({ message: 'Admin not found' });

        const isMatch = await bcrypt.compare(password, admin[0].password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await db.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);


        // Send email notification
        await transporter.sendMail({
            from: `"Your App Admin Panel" <${process.env.SMTP_USER}>`,
            to: admin[0].email,
            subject: "Password Changed",
            html: `
                <h3>Hi ${admin[0].name},</h3>
                <p>Your password has been changed successfully.</p>
                <p>If you did not request this change, please contact support immediately.</p>
                <br />
                <p>Best Regards,<br>Your Team</p>
            `
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// get all users, public
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// update image approve status
router.put('/approve/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const [photo] = await db.query('SELECT approved FROM photos WHERE id = ?', [id]);
        if (photo.length === 0) return res.status(404).json({ message: 'Photo not found' });

        const newStatus = photo[0].approved === 1 ? 0 : 1;
        await db.query('UPDATE photos SET approved = ? WHERE id = ?', [newStatus, id]);
        res.json({ message: `Photo ${newStatus === 1 ? 'approved' : 'rejected'}`, status: newStatus });


        // Send email notification to user
        const [user] = await db.query('SELECT email FROM users WHERE id = (SELECT user_id FROM photos WHERE id = ?)', [id]);
        if (user.length > 0) {
            await transporter.sendMail({
                from: `"Your App Admin Panel" <${process.env.SMTP_USER}>`,
                to: user[0].email,
                subject: `Photo ${newStatus === 1 ? 'Approved' : 'Rejected'}`,
                html: `
                    <h3>Hi,</h3>
                    <p>Your photo has been ${newStatus === 1 ? 'approved' : 'rejected'}.</p>
                    <br />
                    <p>Best Regards,<br>Your Team</p>
                `
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
