export async function up(connection) {
  await connection.query(`
    CREATE TABLE blacklisted_tokens (
id INT(11) NOT NULL AUTO_INCREMENT,
token_hash VARCHAR(64) NOT NULL,
user_id INT(11) NOT NULL,
expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (id)
)
  `);
}

export async function down(connection) {
  await connection.query('DROP TABLE IF EXISTS blacklisted_tokens');
