export async function up(connection) {
  await connection.query(`
    CREATE TABLE notifications (
      notification_id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      seller_id INT,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      notification_type ENUM('system', 'allocation', 'payment', 'alert', 'announcement') DEFAULT 'system',
      related_id INT,
      status ENUM('unread', 'read', 'archived') DEFAULT 'unread',
      action_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES sellers(seller_id) ON DELETE SET NULL,
      INDEX idx_user (user_id),
      INDEX idx_status (status),
      INDEX idx_created (created_at),
      INDEX idx_type (notification_type)
    )
  `);
}

export async function down(connection) {
  await connection.query('DROP TABLE IF EXISTS notifications');
}
