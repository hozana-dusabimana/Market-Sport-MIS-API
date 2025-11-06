const app = require('./src/app');
const config = require('./src/config/config');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`═══════════════════════════════════════`);
  console.log(`  Market Spoton Server Started`);
  console.log(`  Environment: ${config.env}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Database: ${config.database.name}`);
  console.log(`═══════════════════════════════════════`);
});