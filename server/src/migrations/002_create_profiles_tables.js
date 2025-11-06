module.exports = {
  async up(connection) {
    // Admins table
    await connection.query(`
      CREATE TABLE admins (
        admin_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        id_number VARCHAR(50) UNIQUE NOT NULL,
        department VARCHAR(100),
        permissions JSON,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Managers table
    await connection.query(`
      CREATE TABLE managers (
        manager_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        id_number VARCHAR(50) UNIQUE NOT NULL,
        assigned_zones JSON,
        employment_date DATE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Sellers table
    await connection.query(`
      CREATE TABLE sellers (
        seller_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        id_number VARCHAR(50) UNIQUE NOT NULL,
        business_name VARCHAR(150),
        business_type VARCHAR(100),
        tin_number VARCHAR(50),
        emergency_contact VARCHAR(20),
        address TEXT,
        registration_date DATE NOT NULL,
        verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_verification (verification_status)
      )
    `);
  },

  async down(connection) {
    await connection.query('DROP TABLE IF EXISTS sellers');
    await connection.query('DROP TABLE IF EXISTS managers');
    await connection.query('DROP TABLE IF EXISTS admins');
  }
};