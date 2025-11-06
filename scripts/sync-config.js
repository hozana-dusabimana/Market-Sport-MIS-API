const fs = require('fs');
const path = require('path');

// Read global config
const configPath = path.join(__dirname, '..', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Generate server .env file
const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
const serverEnv = `
# Server Configuration
NODE_ENV=${config.server.env}
PORT=${config.server.port}
HOST=${config.server.host}

# Database Configuration
DB_HOST=${config.database.host}
DB_PORT=${config.database.port}
DB_USER=${config.database.user}
DB_PASSWORD=${config.database.password}
DB_NAME=${config.database.name}

# JWT Configuration
JWT_SECRET=${config.jwt.secret}
JWT_EXPIRE=${config.jwt.expiresIn}

# Bcrypt Configuration
BCRYPT_ROUNDS=${config.bcrypt.rounds}
`.trim();

// Generate client .env file
const clientEnvPath = path.join(__dirname, '..', 'client', '.env');
const clientEnv = `
# Client Configuration
VITE_API_URL=${config.client.apiUrl}
VITE_APP_NAME=${config.app.name}
VITE_APP_VERSION=${config.app.version}
`.trim();

// Write files
fs.writeFileSync(serverEnvPath, serverEnv);
fs.writeFileSync(clientEnvPath, clientEnv);

console.log('✅ Configuration files synced successfully!');
console.log(`   - Server .env: ${serverEnvPath}`);
console.log(`   - Client .env: ${clientEnvPath}`);

