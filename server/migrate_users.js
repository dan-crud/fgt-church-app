const db = require('./config/db');

async function migrate() {
  try {
    console.log('Running migration: Two-Level Auth System...');

    // 1. Add 'role' column to existing users table (admin accounts)
    try {
      await db.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'admin'");
      console.log('✓ Added role column to users table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('→ role column already exists in users table');
      } else throw err;
    }

    // 2. Create church_users table for member/staff logins
    await db.execute(`
      CREATE TABLE IF NOT EXISTS church_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(200) DEFAULT '',
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created church_users table');

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
