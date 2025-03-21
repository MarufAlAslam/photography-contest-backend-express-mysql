const express = require('express');
const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middlewares/authMiddleware');  // Importing JWT authentication middleware

const router = express.Router();

// Multer setup — store photos in 'uploads/' folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}${ext}`;
        cb(null, filename);
    },
});
const upload = multer({ storage });

// Public Route: Get all photos
router.get('/', async (req, res) => {
    try {
        const [photos] = await db.query('SELECT * FROM photos');
        res.json(photos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Protected Route: Upload a new photo (with JWT)
router.post('/upload', authenticateToken, upload.single('photo'), async (req, res) => {
    const { description, name, place, species_type, scenic, length, weight, lure, awards } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Photo is required' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    try {
        await db.query(
            'INSERT INTO photos (description, name, place, species_type, scenic, length, weight, lure, awards, image_path, photo_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                description,
                name,
                place,
                species_type,
                scenic,
                length,
                weight,
                lure,
                awards,
                req.file.path, // storing the path of the image for reference
                photoUrl,
                req.user.id // user ID from the JWT token
            ]
        );

        res.status(201).json({ message: 'Photo uploaded successfully', photoUrl });
    } catch (error) {
        console.error('Error while uploading photo:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Protected Route: Edit photo details
router.put('/:id', authenticateToken, upload.single('photo'), async (req, res) => {
    const { id } = req.params;
    const { description, name, place, species_type, scenic, length, weight, lure, awards } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const [photo] = await db.query('SELECT * FROM photos WHERE id = ?', [id]);

        if (photo.length === 0) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Ensure the user is the owner of the photo
        if (photo[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You cannot edit this photo' });
        }

        // Update photo details
        const updateQuery = `
      UPDATE photos 
      SET description = ?, name = ?, place = ?, species_type = ?, scenic = ?, length = ?, weight = ?, lure = ?, awards = ?, image_path = IFNULL(?, image_path), photo_url = IFNULL(?, photo_url)
      WHERE id = ?
    `;
        await db.query(updateQuery, [
            description,
            name,
            place,
            species_type,
            scenic,
            length,
            weight,
            lure,
            awards,
            req.file ? req.file.path : null,
            photoUrl,
            id
        ]);

        res.json({ message: 'Photo updated successfully', photoUrl });
    } catch (error) {
        console.error('Error while updating photo:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Get single photo by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [photo] = await db.query('SELECT * FROM photos WHERE id = ?', [id]);

        if (photo.length === 0) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        res.json(photo[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete photo by ID
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    console.log('User ID:', req.user.id);

    try {
        const [photo] = await db.query('SELECT * FROM photos WHERE id = ?', [id]);

        if (photo.length === 0) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Ensure the user is the owner of the photo
        if (photo[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You cannot delete this photo' });
        }

        // Delete the photo file from the server
        const photoPath = path.join(__dirname, '..', 'uploads', photo[0].photo_url.split('/').pop());

        fs.unlink(photoPath, (err) => {
            if (err) {
                console.error('Error deleting photo file:', err);
            } else {
                console.log('Photo file deleted successfully');
            }
        });

        // Delete the photo from the database
        await db.query('DELETE FROM photos WHERE id = ?', [id]);

        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
