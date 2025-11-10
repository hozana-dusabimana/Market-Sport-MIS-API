const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const errorMiddleware = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const sellerRoutes = require('./routes/seller.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Market Spoton API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);


// Uncomment these routes as you create them
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/sellers', sellerRoutes);
// app.use('/api/v1/zones', zoneRoutes);
// app.use('/api/v1/spaces', spaceRoutes);
// app.use('/api/v1/allocations', allocationRoutes);
// app.use('/api/v1/payments', paymentRoutes);
// app.use('/api/v1/notifications', notificationRoutes);
// app.use('/api/v1/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Error handling
app.use(errorMiddleware);

module.exports = app;