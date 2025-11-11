import crypto from 'crypto';
import db from './src/config/database.js';

// Generate a valid JWT token for testing
function generateToken(userId, username, userType) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    user_id: userId,
    username: username,
    user_type: userType,
    iat: Math.floor(Date.now() / 1000)
  };

  const secret = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2'; // From .env JWT_SECRET

  // Create token parts
  const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64url');

  const token = `${headerEncoded}.${payloadEncoded}.${signature}`;
  
  console.log('✅ Generated JWT Token:');
  console.log(token);
  console.log('\n📝 Decoded Payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  process.exit(0);
}

generateToken(3, 'kwizeriimana', 'seller');
