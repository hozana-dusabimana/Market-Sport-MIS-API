import { createServer } from 'http';
import app from './src/app.js';
import config from './src/config/config.js';
import socketService from './src/services/socketService.js';

const PORT = config.port;
const server = createServer(app);

// Initialize Socket.IO
socketService.init(server);

server.listen(PORT, () => {
  console.log(`═══════════════════════════════════════`);
  console.log(`  Market Spoton Server Started`);
  console.log(`  Environment: ${config.env}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Database: ${config.database.name}`);
  console.log(`  Socket.IO: Enabled`);
  console.log(`═══════════════════════════════════════`);
}
);
