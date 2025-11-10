module.exports = {
  async up(connection) {
    await connection.query(`
      CREATE TABLE users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        user_type ENUM('admin', 'manager', 'seller') NOT NULL,
        status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
        profile_photo VARCHAR(255),
        reset_token VARCHAR(255) NULL,
        reset_token_expires DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_user_type (user_type),
        INDEX idx_status (status)
      )
    `);
  },

  async down(connection) {
    await connection.query('DROP TABLE IF EXISTS users');
  }
};