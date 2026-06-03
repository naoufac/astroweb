/**
 * AstroWeb Backend Server
 * Express server for astrology API endpoints
 */

const express = require('express');
const cors = require('cors');

const chartApi = require('./api/chart');
const transitsApi = require('./api/transits');
const aspectsApi = require('./api/aspects');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Mount API routes
app.use('/api', chartApi);
app.use('/api', transitsApi);
app.use('/api', aspectsApi);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'astroweb',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'AstroWeb API',
    version: '1.0.0',
    endpoints: {
      chart: 'GET /api/chart?birthdate=YYYY-MM-DD&time=HH:MM&lat=LAT&lon=LON&houses=placidus|wholesign|campanus',
      transits: 'GET /api/transits?date=YYYY-MM-DD&lat=LAT&lon=LON',
      aspects: 'GET /api/aspects?birthdate=YYYY-MM-DD&time=HH:MM&lat=LAT&lon=LON&date=YYYY-MM-DD'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`AstroWeb server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;