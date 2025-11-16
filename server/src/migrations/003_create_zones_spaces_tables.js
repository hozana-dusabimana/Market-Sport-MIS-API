export async function up(connection) {
    // Zones table
    await connection.query(`
      CREATE TABLE zones (
        zone_id INT PRIMARY KEY AUTO_INCREMENT,
        zone_name VARCHAR(100) NOT NULL,
        zone_code VARCHAR(20) UNIQUE NOT NULL,
        description TEXT,
        manager_id INT,
        total_spaces INT NOT NULL DEFAULT 0,
        occupied_spaces INT DEFAULT 0,
        status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES managers(manager_id) ON DELETE SET NULL,
        INDEX idx_zone_status (status)
      )
    `);

    // Spaces table
    await connection.query(`
      CREATE TABLE spaces (
        space_id INT PRIMARY KEY AUTO_INCREMENT,
        zone_id INT NOT NULL,
        space_number VARCHAR(20) NOT NULL,
        space_name VARCHAR(100) NULL,
        space_type ENUM('standard', 'premium', 'corner', 'storage') NOT NULL,
        size_sqm DECIMAL(6,2),
        daily_rate DECIMAL(10,2) NOT NULL,
        weekly_rate DECIMAL(10,2),
        monthly_rate DECIMAL(10,2),
        status ENUM('available', 'occupied', 'reserved', 'maintenance') DEFAULT 'available',
        features TEXT,
        manager_id INT NULL,
        created_by_manager_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (zone_id) REFERENCES zones(zone_id) ON DELETE CASCADE,
        UNIQUE KEY unique_space (zone_id, space_number),
        INDEX idx_space_status (status),
        INDEX idx_space_type (space_type)
      )
    `);
}

export async function down(connection) {
  await connection.query('DROP TABLE IF EXISTS spaces');
  await connection.query('DROP TABLE IF EXISTS zones');
