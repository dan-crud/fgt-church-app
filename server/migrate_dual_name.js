const db = require('./config/db');

async function migrate() {
    try {
        console.log("Checking for 'name_en' column in 'donations' table...");
        
        // Add name_en column if it doesn't exist
        const query = `
            ALTER TABLE donations 
            ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) AFTER name;
        `;
        
        await db.execute(query);
        console.log("Database updated successfully: 'name_en' column added to 'donations' table.");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'name_en' already exists.");
            process.exit(0);
        } else {
            console.error("Error during migration:", err);
            process.exit(1);
        }
    }
}

migrate();
