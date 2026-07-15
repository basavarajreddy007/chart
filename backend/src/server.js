const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const User = require('./models/User');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  const io = initSocket(server);
  
  app.set('io', io);

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@chartapp.com';
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (!adminExists) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
      const defaultAdmin = new User({
        email: adminEmail,
        password: adminPassword,
        username: 'admin',
        displayName: 'System Admin',
        role: 'admin',
        isVerified: true,
      });
      await defaultAdmin.save();
      logger.info(`Seeded default administrator: ${adminEmail} / ${adminPassword}`);
    }
  } catch (error) {
    logger.error(`Error seeding admin user: ${error.message}`);
  }

  server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  const shutDown = () => {
    logger.info('Shutting down server...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutDown);
  process.on('SIGINT', shutDown);
};

startServer();
