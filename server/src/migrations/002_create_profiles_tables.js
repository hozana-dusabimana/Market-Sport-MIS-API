export async function up(connection) {
  // admins
  await connection.query(`
    CREATE TABLE admins (
      admin_id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      id_number VARCHAR(50) UNIQUE NOT NULL,
      department VARCHAR(100),
      permissions JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // managers
  await connection.query(`
    CREATE TABLE managers (
      manager_id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      id_number VARCHAR(50) UNIQUE NOT NULL,
      assigned_zones JSON NULL,
      employment_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // sellers
  await connection.query(`
    CREATE TABLE sellers (
      seller_id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      id_number VARCHAR(50) UNIQUE NOT NULL,
      business_name VARCHAR(255),
      business_type VARCHAR(100),
      tin_number VARCHAR(100),
      emergency_contact VARCHAR(100),
      address TEXT,
      registration_date DATE NULL,
      verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function down(connection) {
  await connection.query('DROP TABLE IF EXISTS sellers');
  await connection.query('DROP TABLE IF EXISTS managers');
  await connection.query('DROP TABLE IF EXISTS admins');
}