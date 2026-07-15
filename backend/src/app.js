const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/error');
const { register, observabilityMiddleware } = require('./middleware/observability');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const productivityRoutes = require('./routes/productivityRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isLocalhostOrIP = origin.startsWith('http://localhost') || 
                            origin.startsWith('http://127.0.0.1') ||
                            origin.startsWith('http://10.') || 
                            origin.startsWith('http://192.168.') ||
                            origin.startsWith('http://172.');
                            
    if (
      isLocalhostOrIP || 
      origin === process.env.CLIENT_URL || 
      process.env.NODE_ENV === 'development'
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      cookies[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  req.cookies = cookies;
  next();
});

app.use(observabilityMiddleware);

const uploadsPath = path.join(__dirname, '../../public/uploads');
app.use('/uploads', express.static(uploadsPath));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/workspace', productivityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

app.use(errorHandler);

module.exports = app;
