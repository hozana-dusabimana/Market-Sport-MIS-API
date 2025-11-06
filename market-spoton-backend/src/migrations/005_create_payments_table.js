module.exports = {
  async up(connection) {
    await connection.query(`
      CREATE TABLE payments (
        payment_id INT PRIMARY KEY AUTO_INCREMENT,
        allocation_id INT NOT NULL,
        seller_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_date DATETIME NOT NULL,
        payment_method ENUM('mobile_money', 'cash', 'bank_transfer', 'card') NOT NULL,
        payment_reference VARCHAR(100) UNIQUE,
        payment_period_start DATE NOT NULL,
        payment_period_end DATE NOT NULL,
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
        processed_by INT,
        mobile_money_number VARCHAR(20),
        mobile_money_provider VARCHAR(50),
        transaction_id VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (allocation_id) REFERENCES space_allocations(allocation_id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES sellers(seller_id) ON DELETE CASCADE,
        INDEX idx_payment_status (status),
        INDEX idx_payment_date (payment_date),
        INDEX idx_seller_payment (seller_id)
      )
    `);

    await connection.query(`
      CREATE TABLE payment_reminders (
        reminder_id INT PRIMARY KEY AUTO_INCREMENT,
        allocation_id INT NOT NULL,
        seller_id INT NOT NULL,
        due_date DATE NOT NULL,
        amount_due DECIMAL(10,2) NOT NULL,
        reminder_sent BOOLEAN DEFAULT FALSE,
        reminder_sent_date DATETIME,
        status ENUM('pending', 'sent', 'paid', 'overdue') DEFAULT 'pending',
        FOREIGN KEY (allocation_id) REFERENCES space_allocations(allocation_id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES sellers(seller_id) ON DELETE CASCADE,
        INDEX idx_due_date (due_date),
        INDEX idx_reminder_status (status)
      )
    `);
  },

  async down(connection) {
    await connection.query('DROP TABLE IF EXISTS payment_reminders');
    await connection.query('DROP TABLE IF EXISTS payments');
  }
};