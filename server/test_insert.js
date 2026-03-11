const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fgt_church_db'
    });

    try {
        const [res] = await db.execute(
            'INSERT INTO donations (name, name_en, amount, year, month) VALUES (?, ?, ?, ?, ?)',
            ['Test Nepali', 'Test English Name', '100.00', '2026', 'मार्च']
        );
        console.log('Insert Result:', res);
        const [rows] = await db.execute('SELECT * FROM donations WHERE id = ?', [res.insertId]);
        console.log('Resulting Row:', rows[0]);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
    }
}

test();
