# Market SpotOn System

A comprehensive digital market management platform designed to replace traditional manual market operations. The system streamlines zone and space allocation, seller registration, payment processing, reporting, and communication between market authorities and sellers.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Market-Sport-MIS-API
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure the system**
   - Edit `config.json` in the root directory with your settings
   - Run the sync script to generate .env files:
     ```bash
     node scripts/sync-config.js
     ```
   - Or manually configure:
     - `server/.env` - Backend configuration
     - `client/.env` - Frontend configuration

4. **Setup database**
   ```bash
   npm run migrate
   npm run seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both:
- **Backend API**: http://localhost:3000
- **Frontend Client**: http://localhost:5173

## 📁 Project Structure

```
Market-Sport-MIS-API/
├── config.json          # Global configuration file
├── package.json         # Root package.json with scripts
├── scripts/             # Utility scripts
│   ├── sync-config.js   # Sync config.json to .env files
│   └── read-config.js   # Read config utility
├── server/              # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── migrations/
│   └── package.json
└── client/              # Frontend (React/TypeScript)
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── services/
    │   └── store/
    └── package.json
```

## ⚙️ Configuration

### Global Configuration (`config.json`)

The `config.json` file contains all shared configuration for both server and client:

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "client": {
    "port": 5173,
    "apiUrl": "http://localhost:3000/api/v1"
  },
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "name": "market_spoton_db"
  }
}
```

### Syncing Configuration

After modifying `config.json`, sync it to .env files:

```bash
node scripts/sync-config.js
```

## 📜 Available Scripts

### Root Level (Run Both Server & Client)

- `npm run dev` - Start both server and client in development mode
- `npm run start` - Start both in production mode
- `npm run install:all` - Install dependencies for all projects
- `npm run setup` - Complete setup (install + migrate + seed)
- `npm run build` - Build the client for production

### Server Only

- `npm run dev:server` - Start server in development mode
- `npm run start:server` - Start server in production mode
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data

### Client Only

- `npm run dev:client` - Start client in development mode
- `npm run build` - Build for production

## 🔧 Development

### Backend Development

1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. API will be available at: http://localhost:3000

### Frontend Development

1. Navigate to client directory:
   ```bash
   cd client
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. App will be available at: http://localhost:5173

## 🗄️ Database

### Running Migrations

```bash
npm run migrate          # Run all pending migrations
npm run migrate:down     # Rollback last migration
npm run migrate:fresh    # Drop database and run all migrations
```

### Seeding Database

```bash
npm run seed            # Run all seeders
```

## 🔐 Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Change these credentials immediately after first login!**

## 📚 Features

- ✅ Zone & Space Management
- ✅ Seller Registration
- ✅ Integrated Payment System
- ✅ Comprehensive Reporting
- ✅ Automated Notifications
- ✅ User Dashboards (Admin, Manager, Seller)
- ✅ Real-time Data Tracking
- ✅ Mobile Money Integration

## 🛠️ Tech Stack

### Backend
- Node.js with Express.js
- MySQL Database
- JWT Authentication
- Database Migrations

### Frontend
- React 18 with TypeScript
- Vite
- Tailwind CSS
- React Query
- Zustand

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

