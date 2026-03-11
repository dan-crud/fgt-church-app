const db = require('./config/db');

async function createCMSTables() {
    try {
        console.log("Creating CMS tables...");

        const siteContentQuery = `
            CREATE TABLE IF NOT EXISTS site_content (
                setting_key VARCHAR(255) PRIMARY KEY,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await db.execute(siteContentQuery);
        console.log("Table 'site_content' created successfully.");

        // Initialize default keys
        const defaultTexts = [
            ['home_info', 'Welcome to FGT Church Nepalgunj. Come to me, all you who are weary and burdened, and I will give you rest. — Matthew 11:28'],
            ['about_text', 'About FGT Church Nepalgunj: We are a community of believers dedicated to spreading the love and teachings of Jesus Christ in Nepalgunj.'],
            ['testimony_text', 'Share your testimonies here to inspire others.']
        ];
        
        for (const [key, val] of defaultTexts) {
            await db.execute(
                'INSERT IGNORE INTO site_content (setting_key, setting_value) VALUES (?, ?)',
                [key, val]
            );
        }
        console.log("Default site_content initialized.");

        const galleryQuery = `
            CREATE TABLE IF NOT EXISTS gallery_photos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                image_url VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.execute(galleryQuery);
        console.log("Table 'gallery_photos' created successfully.");

        process.exit(0);
    } catch (err) {
        console.error("Error creating tables:", err);
        process.exit(1);
    }
}

createCMSTables();
