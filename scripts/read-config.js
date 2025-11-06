const fs = require('fs');
const path = require('path');

/**
 * Read and parse the global config.json file
 * @returns {Object} Configuration object
 */
function readConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('config.json not found. Please create it in the root directory.');
  }
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(configContent);
}

/**
 * Get server configuration
 * @returns {Object} Server config
 */
function getServerConfig() {
  const config = readConfig();
  return {
    ...config.server,
    database: config.database,
    jwt: config.jwt,
    bcrypt: config.bcrypt,
  };
}

/**
 * Get client configuration
 * @returns {Object} Client config
 */
function getClientConfig() {
  const config = readConfig();
  return {
    ...config.client,
    app: config.app,
  };
}

module.exports = {
  readConfig,
  getServerConfig,
  getClientConfig,
};

