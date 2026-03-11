const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Logger middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// Serve the uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload dir exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Just store as template.png/jpg to overwrite
        const ext = path.extname(file.originalname) || '.png';
        cb(null, 'template' + ext);
    }
});
const upload = multer({ storage });

// --- ROUTES ---

// 1. Admin Auth Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            res.json({ success: true, message: 'Logged in successfully', role: 'admin', username: rows[0].username });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Church Users Management (Admin only)
// GET all church users
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, full_name, created_at FROM church_users ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST create new church user
app.post('/api/users', async (req, res) => {
    const { username, password, full_name } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    try {
        await db.execute(
            'INSERT INTO church_users (username, password, full_name) VALUES (?, ?, ?)',
            [username, password, full_name || '']
        );
        res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Username already exists' });
        }
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE church user
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute('DELETE FROM church_users WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'User deleted' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Change own password (admin or user)
app.put('/api/auth/change-password', async (req, res) => {
    const { username, currentPassword, newPassword, role } = req.body;
    if (!username || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'All fields required' });
    }
    try {
        const table = role === 'admin' ? 'users' : 'church_users';
        const [rows] = await db.execute(`SELECT * FROM ${table} WHERE username = ? AND password = ?`, [username, currentPassword]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        await db.execute(`UPDATE ${table} SET password = ? WHERE username = ?`, [newPassword, username]);
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: Reset a church user's password (no old password required)
app.put('/api/users/:id/password', async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) {
        return res.status(400).json({ success: false, message: 'New password required' });
    }
    try {
        const [result] = await db.execute('UPDATE church_users SET password = ? WHERE id = ?', [newPassword, id]);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'User password updated' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.post('/api/donations', async (req, res) => {
    const { name, name_en, amount, year, month } = req.body;
    if (!name || !amount || !year || !month) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    try {
        await db.execute(
            'INSERT INTO donations (name, name_en, amount, year, month) VALUES (?, ?, ?, ?, ?)',
            [name, name_en || '', amount, year, month]
        );
        res.status(201).json({ success: true, message: 'Registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to insert donation' });
    }
});

app.get('/api/donations', async (req, res) => {
    const { year, month } = req.query;
    let query = 'SELECT * FROM donations WHERE 1=1';
    const params = [];

    if (year) {
        query += ' AND year = ?';
        params.push(year);
    }
    if (month && month !== 'All') {
        query += ' AND month = ?';
        params.push(month);
    }

    query += ' ORDER BY created_at DESC';

    try {
        const [rows] = await db.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch donations' });
    }
});



app.delete('/api/donations/:id', async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM donations WHERE id = ?', [req.params.id]);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Deleted successfully' });
        } else {
            console.log(`Donation with ID ${req.params.id} not found for deletion`);
            res.status(404).json({ success: false, message: 'Record not found' });
        }
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete donation' });
    }
});

app.post('/api/donations/bulk-delete', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'No IDs provided' });
    }

    try {
        // Using IN clause for bulk deletion
        const query = `DELETE FROM donations WHERE id IN (${ids.map(() => '?').join(',')})`;
        const [result] = await db.execute(query, ids);

        res.json({
            success: true,
            message: `${result.affectedRows} records deleted successfully`,
            deletedCount: result.affectedRows
        });
    } catch (err) {
        console.error('Bulk delete error:', err);
        res.status(500).json({ success: false, message: 'Failed to perform bulk delete' });
    }
});

// 3. Template Photo
app.post('/api/template', upload.single('templateImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const templatePath = `/uploads/${req.file.filename}`;

    try {
        // Upsert into settings table
        await db.execute(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['template_image', templatePath, templatePath]
        );
        res.json({ success: true, message: 'Template updated', path: templatePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error storing template path' });
    }
});

app.get('/api/template', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT setting_value FROM settings WHERE setting_key = ?', ['template_image']);
        if (rows.length > 0) {
            res.json({ success: true, path: rows[0].setting_value });
        } else {
            res.json({ success: true, path: null });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch template' });
    }
});


// 3. New Members (Contact Form)
app.post('/api/contact-submissions', async (req, res) => {
    const { name, email, phone, message } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and Phone are required' });
    }
    try {
        await db.execute(
            'INSERT INTO new_members (name, email, mobile_number, message, status) VALUES (?, ?, ?, ?, ?)',
            [name, email || '', phone || '', message || '', 'New']
        );
        res.status(201).json({ success: true, message: 'Submission successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to save submission' });
    }
});

app.get('/api/contact-submissions', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM new_members ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
    }
});

app.put('/api/contact-submissions/:id/view', async (req, res) => {
    try {
        await db.execute('UPDATE new_members SET status = "Viewed" WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Marked as viewed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// 4. CMS Site Content
app.get('/api/content/:key', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT setting_value FROM site_content WHERE setting_key = ?', [req.params.key]);
        if (rows.length > 0) {
            res.json({ success: true, data: rows[0].setting_value });
        } else {
            res.json({ success: true, data: '' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch content' });
    }
});

app.put('/api/content/:key', async (req, res) => {
    const { value } = req.body;
    try {
        await db.execute(
            'INSERT INTO site_content (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            [req.params.key, value, value]
        );
        res.json({ success: true, message: 'Content updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update content' });
    }
});

// Card Coordinate Settings (Persistence)
app.get('/api/settings/card-coords', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT setting_value FROM settings WHERE setting_key = ?', ['card_coords']);
        if (rows.length > 0 && rows[0].setting_value) {
            try {
                res.json({ success: true, data: JSON.parse(rows[0].setting_value) });
            } catch (pErr) {
                console.error('JSON Parse error for card-coords:', pErr);
                res.json({ success: true, data: null });
            }
        } else {
            res.json({ success: true, data: null });
        }
    } catch (err) {
        console.error('Fetch settings error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

app.post('/api/settings/card-coords', async (req, res) => {
    const { coords } = req.body;
    try {
        const value = JSON.stringify(coords);
        await db.execute(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            ['card_coords', value, value]
        );
        res.json({ success: true, message: 'Settings saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to save settings' });
    }
});

// 5. Gallery Photos
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'gallery-' + uniqueSuffix + ext);
    }
});
const uploadGallery = multer({ storage: galleryStorage });

app.post('/api/gallery', uploadGallery.array('galleryImage', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let { title, description } = req.body;
    title = title || '';
    description = description || '';

    const errors = [];
    const savedPhotos = [];

    for (let file of req.files) {
        const imagePath = `/uploads/${file.filename}`;
        try {
            const [result] = await db.execute(
                'INSERT INTO gallery_photos (image_url, title, description) VALUES (?, ?, ?)',
                [imagePath, title, description]
            );
            savedPhotos.push({
                id: result.insertId,
                image_url: imagePath,
                title,
                description
            });
        } catch (err) {
            console.error(err);
            errors.push(`Failed to save ${file.originalname}`);
        }
    }

    if (errors.length > 0 && savedPhotos.length === 0) {
        return res.status(500).json({ success: false, message: 'Database error storing photo paths', errors });
    }

    res.json({
        success: true,
        message: 'Photos uploaded successfully',
        photos: savedPhotos,
        errors: errors.length > 0 ? errors : undefined
    });
});

app.get('/api/gallery', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM gallery_photos ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch gallery photos' });
    }
});

app.delete('/api/gallery/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM gallery_photos WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Photo deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to delete photo' });
    }
});

// 6. Testimonies
const testimonyStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'testimony-' + uniqueSuffix + ext);
    }
});
const uploadTestimony = multer({ storage: testimonyStorage });

app.post('/api/testimonies', uploadTestimony.single('testimonyImage'), async (req, res) => {
    let { name, text } = req.body;
    if (!name || !text) {
        return res.status(400).json({ success: false, message: 'Name and text are required' });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const [result] = await db.execute(
            'INSERT INTO testimonies (name, text, image_url) VALUES (?, ?, ?)',
            [name, text, imagePath]
        );
        res.status(201).json({
            success: true,
            message: 'Testimony created successfully',
            testimony: { id: result.insertId, name, text, image_url: imagePath }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to create testimony' });
    }
});

app.get('/api/testimonies', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM testimonies ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch testimonies' });
    }
});

app.delete('/api/testimonies/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM testimonies WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Testimony deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to delete testimony' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
