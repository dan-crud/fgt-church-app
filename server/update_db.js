const db = require('./config/db');

async function updateTable() {
    try {
        const query = `
            ALTER TABLE gallery_photos 
            ADD COLUMN IF NOT EXISTS title VARCHAR(255),
            ADD COLUMN IF NOT EXISTS description TEXT;
        `;
        await db.execute(query);
        console.log("Table 'gallery_photos' updated successfully with title and description.");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist.");
            process.exit(0);
        } else {
            console.error("Error updating table:", err);
            process.exit(1);
        }
    }
}

updateTable();
