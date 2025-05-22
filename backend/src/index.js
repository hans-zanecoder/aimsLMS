require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const { logger, loggerMiddleware } = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const programRoutes = require('./routes/programs');
const User = require('./models/User');
const instructorsRouter = require('./routes/instructors');
const userSettingsRouter = require('./routes/userSettings');
const booksRouter = require('./routes/books');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(loggerMiddleware);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));
// For compatibility with existing code still using /uploads path
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Global rate limiter
app.use(apiLimiter);

// CORS configuration
const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
logger.info(`CORS configured for origin: ${corsOrigin}`);
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Make sure CORS is applied before any routes
app.options('*', cors());

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
  
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/instructors', instructorsRouter);
app.use('/api/user', userSettingsRouter);
app.use('/api/books', booksRouter);

// Create initial users if they don't exist
async function createInitialUsers() {
  try {
    const users = [
      {
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      },
      {
        email: 'instructor@example.com',
        password: 'teach123',
        role: 'instructor',
        firstName: 'Instructor',
        lastName: 'User'
      },
      {
        email: 'student@example.com',
        password: 'learn123',
        role: 'student',
        firstName: 'Student',
        lastName: 'User'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        console.log(`Created ${userData.role} user`);
      }
    }
    console.log('Initial users check completed');
  } catch (error) {
    console.error('Error creating initial users:', error);
  }
}

// Try to start server on a port
async function tryStartServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .once('listening', () => {
        console.log(`Server running on port ${port}`);
        resolve(true);
      })
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying next port...`);
          resolve(false);
        } else {
          reject(err);
        }
      });
  });
}

// Start MongoDB connection and server
async function startServer() {
  try {
    // Validate critical environment variables
    if (!process.env.JWT_SECRET) {
      console.error('ERROR: JWT_SECRET environment variable is not set!');
      process.exit(1);
    }
    
    // Connect to database based on environment
    const isProd = process.env.NODE_ENV === 'production';
    const isDev = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    
    if (isProd) {
      // Production: Use real MongoDB connection
      if (!process.env.MONGODB_URI) {
        console.error('ERROR: MONGODB_URI environment variable is not set in production!');
        process.exit(1);
      }
      
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log('Connected to production MongoDB database');
      } catch (dbError) {
        console.error('Failed to connect to production database:', dbError);
        process.exit(1);
      }
    } else {
      // Development/Test: Try MongoDB Atlas first, then fall back to in-memory database
      let connected = false;
      
      // First try Atlas if we have a connection string
      if (process.env.MONGODB_URI) {
        try {
          console.log('Attempting to connect to MongoDB Atlas...');
          console.log('Using connection string (first 20 chars):', process.env.MONGODB_URI.substring(0, 20) + '...');
          console.log('Full database name from URI:', process.env.MONGODB_URI.split('/').pop().split('?')[0]);
          
          await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          });
          console.log('Successfully connected to MongoDB Atlas!');
          console.log('Connected database name:', mongoose.connection.name);
          console.log('Connected to host:', mongoose.connection.host);
          connected = true;
        } catch (atlasError) {
          console.warn('Could not connect to MongoDB Atlas:', atlasError.message);
          console.warn('Specific error details:', atlasError);
          console.log('Falling back to in-memory database...');
        }
      }
      
      // If not connected yet, use in-memory database
      if (!connected) {
        let mongod;
        try {
          mongod = await MongoMemoryServer.create();
          const mongoUri = mongod.getUri();
          console.log(`MongoDB Memory Server started for ${process.env.NODE_ENV} environment`);
          
          // Connect to the in-memory database with better options
          await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          });
          console.log('Connected to MongoDB Memory Server');
        } catch (dbError) {
          console.error('Failed to start or connect to MongoDB:', dbError);
          process.exit(1);
        }
      }
    }

    // Create initial users
    if (!isTest) {
      await createInitialUsers();
    }

    // Try ports 5000-5010
    const startPort = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    const maxPort = startPort + 10;
    
    for (let port = startPort; port <= maxPort; port++) {
      const success = await tryStartServer(port);
      if (success) {
        // Update the port in process.env so other parts of the app can use it
        process.env.PORT = port;
        break;
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 