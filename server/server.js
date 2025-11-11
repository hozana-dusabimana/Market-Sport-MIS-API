import app from './src/app.js';
import config from './src/config/config.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`═══════════════════════════════════════`);
  console.log(`  Market Spoton Server Started`);
  console.log(`  Environment: ${config.env}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Database: ${config.database.name}`);
  console.log(`═══════════════════════════════════════`);
});