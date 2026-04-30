require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const connectDB = require('./config/database');
const passport = require('./config/passport');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initializeCronJobs } = require('./jobs/cronJobs');
const { initializeSocket } = require('./socket/socketHandler');
const ragService = require('./services/ragService');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

connectDB();

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(passport.initialize());

app.use('/api', routes);

app.use(notFound);

app.use(errorHandler);

initializeSocket(server);

if (process.env.NODE_ENV !== 'test') {
  initializeCronJobs();
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  logger.info(`Ollama Base URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`);
  ragService.logOllamaStartupStatus().catch((error) => {
    logger.warn('Unable to verify local Ollama startup status', {
      message: error.message,
    });
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
