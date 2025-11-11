export async function up(connection) {
    await connection.query(`
      CREATE TABLE space_allocations (
        allocation_id INT PRIMARY KEY AUTO_INCREMENT,
        seller_id INT NOT NULL,
        space_id INT NOT NULL,
        allocation_date DATE NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        allocation_type ENUM('daily', 'weekly', 'monthly', 'permanent', 'temporary') NOT NULL,
        status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
        approved_by INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(seller_id) ON DELETE CASCADE,
        FOREIGN KEY (space_id) REFERENCES spaces(space_id) ON DELETE CASCADE,
        INDEX idx_allocation_status (status),
        INDEX idx_seller (seller_id),
        INDEX idx_dates (start_date, end_date)
      )
    `);
}

export async function down(connection) {
  await connection.query('DROP TABLE IF EXISTS space_allocations');
}