const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initDemoClock } = require('./utils/demoClockService');
const { startBillingCron } = require('./jobs/billingCron');

const startServer = async () => {
  try {
    // Connect Database
    await connectDB();

    // Initialize Demo Clock
    await initDemoClock();

    // Start automated recurring billing scheduler
    startBillingCron();

    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`  NexSub Subscription Management System Core API`);
      console.log(`  Server running on http://localhost:${env.PORT}`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`=======================================================`);
    });

    const handleShutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (error) {
    console.error('[Server Error] Startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
