require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
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
  contentSecurityPolicy: false, // Adjust based on needs
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173', // Alternative Vite port
    'http://localhost:3000', // Alternative port
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600, // Lazy session update
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

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
