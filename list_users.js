const pool = require('./server/config/db');

async function listUsers() {
  try {
    const [admins] = await pool.execute('SELECT username, password FROM users');
    console.log('--- Admins ---');
    admins.forEach(a => console.log(`Username: ${a.username}, Password: ${a.password}`));

    const [users] = await pool.execute('SELECT username, password FROM church_users');
    console.log('\n--- Church Users ---');
    users.forEach(u => console.log(`Username: ${u.username}, Password: ${u.password}`));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

listUsers();
