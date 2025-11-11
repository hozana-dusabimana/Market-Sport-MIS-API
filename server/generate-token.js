import jwt from 'jsonwebtoken';
import config from './src/config/config.js';

// Generate a valid JWT token for seller with user_id 3
const token = jwt.sign(
  {
    user_id: 3,
    username: 'kwizeriimana',
    user_type: 'seller'
  },
  config.jwt.secret,
  { expiresIn: '7d' }
);

console.log('✅ Valid JWT Token Generated:');
console.log(token);
console.log('\nUse this token with: Authorization: Bearer <token>');
