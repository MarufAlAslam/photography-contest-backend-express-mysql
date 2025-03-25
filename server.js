const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// routes
const photoRoutes = require('./routes/photos');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contacts');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/photos', photoRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/contact', contactRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
