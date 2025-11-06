# Market SpotOn System - React Client

Modern React client application for the Market SpotOn System, built with Vite, TypeScript, and Tailwind CSS.

## Features

- **Zone & Space Management**: Real-time tracking and management of market zones and spaces
- **Seller Registration**: Digital onboarding with automated space allocation
- **Integrated Payment System**: Mobile money and digital payments with instant receipts
- **Comprehensive Reporting**: Daily, weekly, and monthly reports with analytics
- **Automated Notifications**: Instant notifications for payments, allocations, and announcements
- **User Dashboards**: Role-based dashboards for Admin, Manager, and Seller users

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **Recharts** - Charts and graphs
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, defaults are set):
```env
VITE_API_URL=http://localhost:3000/api/v1
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   └── layout/       # Layout components (Header, Sidebar)
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin pages
│   │   ├── seller/       # Seller pages
│   │   ├── manager/      # Manager pages
│   │   ├── auth/         # Auth pages (Login, Register)
│   │   └── shared/      # Shared pages (Profile)
│   ├── services/         # API service layer
│   ├── store/            # Zustand stores
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── package.json
```

## User Roles

### Admin
- Full system access
- Zone and space management
- Seller registration
- Payment management
- Reports and analytics
- Notification management

### Manager
- Zone and space management
- Allocation management
- Payment tracking
- Reports viewing
- Notification management

### Seller
- View allocated spaces
- View payment history
- Make payments
- View notifications
- Profile management

## API Integration

The client communicates with the backend API through service modules in `src/services/`. All API calls are handled through Axios with automatic token injection and error handling.

## Development

### Adding New Features

1. Create service functions in `src/services/`
2. Create page components in `src/pages/`
3. Add routes in `src/App.tsx`
4. Update sidebar navigation if needed

### Styling

The project uses Tailwind CSS with custom utility classes defined in `src/index.css`. Use the predefined button, input, and card classes for consistency.

## License

ISC


