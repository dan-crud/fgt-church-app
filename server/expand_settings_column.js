const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fgt_church_db'
    });

    console.log('Connected to database.');

    try {
        // Change setting_value to TEXT to handle larger JSON objects
        await connection.execute('ALTER TABLE settings MODIFY COLUMN setting_value TEXT');
        console.log('Successfully changed settings.setting_value to TEXT');
    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        await connection.end();
    }
}

migrate();
