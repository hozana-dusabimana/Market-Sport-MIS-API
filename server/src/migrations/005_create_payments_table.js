export async function up(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      payment_id INT PRIMARY KEY AUTO_INCREMENT,
      allocation_id INT NOT NULL,
      seller_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATETIME NOT NULL,
      payment_method ENUM('mobile_money', 'cash', 'bank_transfer', 'card') NOT NULL,
      payment_reference VARCHAR(100) UNIQUE,
      payment_period_start DATE,
      payment_period_end DATE,
      status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
      processed_by INT,
      mobile_money_number VARCHAR(30),
      mobile_money_provider VARCHAR(100),
      transaction_id VARCHAR(200),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (allocation_id) REFERENCES space_allocations(allocation_id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES sellers(seller_id) ON DELETE CASCADE,
      INDEX idx_payment_status (status),
      INDEX idx_payment_date (payment_date),
      INDEX idx_seller_payment (seller_id)
    );
  `);
}

export async function down(connection) {
  await connection.query('DROP TABLE IF EXISTS payments');
