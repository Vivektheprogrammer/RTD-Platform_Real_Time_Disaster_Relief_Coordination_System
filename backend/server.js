const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rtd-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const offerRoutes = require('./routes/offers');
const matchingRoutes = require('./routes/matching');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const governmentRoutes = require('./routes/government');

// Import admin routes
const adminAuthRoutes = require('./routes/admin/auth');
const adminUserRoutes = require('./routes/admin/users');
const adminDashboardRoutes = require('./routes/admin/dashboard');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/government', governmentRoutes);

// Use admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join user-specific room for targeted notifications
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    }
  });
  
  // Listen for new resource requests
  socket.on('newRequest', (requestData) => {
    socket.broadcast.emit('newRequest', requestData);
  });
  
  // Listen for new resource offers
  socket.on('newOffer', (offerData) => {
    socket.broadcast.emit('newOffer', offerData);
  });
  
  // Listen for request updates
  socket.on('requestUpdated', (requestData) => {
    socket.broadcast.emit('requestUpdated', requestData);
  });
  
  // Listen for offer updates
  socket.on('offerUpdated', (offerData) => {
    socket.broadcast.emit('offerUpdated', offerData);
  });
  
  // Listen for matches
  socket.on('requestMatched', (matchData) => {
    socket.broadcast.emit('requestMatched', matchData);
  });
  
  socket.on('offerMatched', (matchData) => {
    socket.broadcast.emit('offerMatched', matchData);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});