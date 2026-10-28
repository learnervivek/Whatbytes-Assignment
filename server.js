import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import mappingRoutes from './routes/mappingRoutes.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Healthcare Backend API is up and running'
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/mappings', mappingRoutes);

// Simple Database Connection Check
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('[Database] PostgreSQL connected successfully via Prisma');
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    console.log('[Database] Tip: Make sure PostgreSQL is running and DATABASE_URL in .env is correct.');
  }
}

// 404 Handler (for non-existent routes)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // Prisma: Unique constraint failed (e.g. duplicate email or duplicate mapping)
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists.`
    });
  }

  // Prisma: Foreign key constraint failed
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference. The related record does not exist.'
    });
  }

  // Prisma: Record to update or delete not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'The requested record was not found.'
    });
  }

  // Malformed JSON body in incoming request
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload format in request body.'
    });
  }

  // General error handling
  const statusCode = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error')
  });
});

// Start the server
const server = app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
  await testDatabaseConnection();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please check other processes or set a different PORT in .env.`);
  } else {
    console.error('Server failed to start:', err.message);
  }
});

