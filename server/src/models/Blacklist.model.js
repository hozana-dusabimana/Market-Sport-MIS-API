const crypto = require('crypto');
const db = require('../config/database');

class Blacklist {
  // Add a token to blacklist (hash it for security)
  static async add(token, userId, tokenExpiry) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(tokenExpiry * 1000); // JWT exp is in seconds

    const [result] = await db.query(
      `INSERT INTO blacklisted_tokens (token_hash, user_id, expires_at) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE expires_at = GREATEST(expires_at, ?)`,
      [tokenHash, userId, expiresAt, expiresAt]
    );

    return result.affectedRows > 0;
  }

  // Check if a token is blacklisted
  static async isBlacklisted(token) {
    // Clean up expired tokens first (optional, for performance)
    await db.query('DELETE FROM blacklisted_tokens WHERE expires_at < NOW()');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await db.query(
      'SELECT id FROM blacklisted_tokens WHERE token_hash = ?',
      [tokenHash]
    );
    return rows.length > 0;
  }

  // Get count of active blacklisted tokens (for monitoring)
  static async countActive() {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM blacklisted_tokens WHERE expires_at > NOW()'
    );
    return rows[0].count;
  }
}

module.exports = Blacklist;