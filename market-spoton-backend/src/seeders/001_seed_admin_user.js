const bcrypt = require('bcryptjs');

module.exports = {
  async seed(connection) {
    const password = await bcrypt.hash('admin123', 10);
    
    const [result] = await connection.query(`
      INSERT INTO users (username, email, password_hash, phone_number, user_type)
      VALUES ('admin', 'admin@marketspoton.com', ?, '+250788000000', 'admin')
    `, [password]);

    await connection.query(`
      INSERT INTO admins (user_id, full_name, id_number, department)
      VALUES (?, 'System Administrator', 'ADM001', 'IT & Operations')
    `, [result.insertId]);

    console.log('  → Admin user created (username: admin, password: admin123)');
  }
};