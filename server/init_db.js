const db = require('./config/db');

async function createTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS new_members (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                address TEXT NOT NULL,
                mobile_number VARCHAR(50) NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.execute(query);
        console.log("Table 'new_members' created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
}

createTable();
