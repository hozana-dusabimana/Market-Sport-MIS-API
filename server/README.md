# Market Spoton System - Backend API

Complete Node.js backend with database migrations for the Market Space Management System.

## Database: market_spoton_db

## Quick Start

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd market-spoton-backend
   npm install
   \`\`\`

2. **Configure Environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your database credentials
   \`\`\`

3. **Run Migrations**
   \`\`\`bash
   npm run migrate        # Run all pending migrations
   npm run seed          # Seed initial data
   \`\`\`

4. **Start Server**
   \`\`\`bash
   npm run dev           # Development mode
   npm start             # Production mode
   \`\`\`

## Migration Commands

- \`npm run migrate\` - Run all pending migrations
- \`npm run migrate:down\` - Rollback last migration
- \`npm run migrate:fresh\` - Drop database and run all migrations
- \`npm run seed\` - Run all seeders

## API Endpoints

Base URL: \`http://localhost:3000/api/v1\`

### Authentication
- POST /auth/register - Register new user
- POST /auth/login - Login user

### Zones
- GET /zones - Get all zones
- POST /zones - Create zone (admin only)
- GET /zones/:id - Get zone details
- PUT /zones/:id - Update zone
- DELETE /zones/:id - Delete zone

### Spaces
- GET /spaces - Get all spaces
- GET /spaces/available - Get available spaces
- POST /spaces - Create space
- PUT /spaces/:id - Update space

### Payments
- POST /payments - Record payment
- GET /payments/seller/:sellerId - Get seller payments

## Project Structure

- \`src/config\` - Configuration files
- \`src/controllers\` - Request handlers
- \`src/models\` - Data models
- \`src/routes\` - API routes
- \`src/middleware\` - Custom middleware
- \`src/migrations\` - Database migrations
- \`src/seeders\` - Database seeders

## Default Admin Credentials
- Username: admin
- Password: admin123

**Change these credentials immediately after first login!**
`\`\`