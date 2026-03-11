const db = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Check if new_members table exists
        const [tables] = await db.execute("SHOW TABLES LIKE 'new_members'");
        
        if (tables.length === 0) {
            console.log('Creating new_members table...');
            await db.execute(`
                CREATE TABLE new_members (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    mobile_number VARCHAR(50),
                    message TEXT,
                    status ENUM('New', 'Viewed') DEFAULT 'New',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } else {
            console.log('Updating new_members table schema...');
            // Add columns if they don't exist
            const [columns] = await db.execute("DESCRIBE new_members");
            const columnNames = columns.map(c => c.Field);

            if (!columnNames.includes('email')) {
                await db.execute("ALTER TABLE new_members ADD COLUMN email VARCHAR(255) AFTER name");
                console.log('Added email column.');
            }
            if (!columnNames.includes('mobile_number') && !columnNames.includes('phone')) {
                await db.execute("ALTER TABLE new_members ADD COLUMN mobile_number VARCHAR(50) AFTER email");
                console.log('Added mobile_number column.');
            }
            if (!columnNames.includes('message')) {
                await db.execute("ALTER TABLE new_members ADD COLUMN message TEXT AFTER mobile_number");
                console.log('Added message column.');
            }
            if (!columnNames.includes('status')) {
                await db.execute("ALTER TABLE new_members ADD COLUMN status ENUM('New', 'Viewed') DEFAULT 'New' AFTER message");
                console.log('Added status column.');
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
