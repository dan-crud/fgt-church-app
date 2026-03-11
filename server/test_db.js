const mysql = require('mysql2/promise');
require('dotenv').config();

const test = async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fgt_church_db'
    });
    try {
        const [rows] = await pool.execute('DESCRIBE settings');
        console.log('Settings table structure:', JSON.stringify(rows, null, 2));
        const [data] = await pool.execute('SELECT * FROM settings');
        console.log('Settings table data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error describing table:', err);
    } finally {
        await pool.end();
    }
};
test();
