/**
 * @fileoverview Main server entry point. Loads config, connects to DB, runs simulation, and listens.
 */
import './config.js';
import app from './app.js';
import { connectDB } from './utils/db.js';
import { simulationService } from './services/simulationService.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // Start listening for requests immediately so Vite proxy connections do not get refused
  const server = app.listen(PORT, async () => {
    console.log(`🚀 Smart Stadium Crowd Management Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    
    // Connect to MongoDB Atlas (with in-memory fallback)
    await connectDB();

    // Start the crowd state tick loop (5-second intervals as confirmed)
    simulationService.start(5000);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\nStopping simulation and shutting down server...');
    simulationService.stop();
    server.close(() => {
      console.log('HTTP Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(err => {
  console.error('Fatal initialization error:', err.message);
  process.exit(1);
});
