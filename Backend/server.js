const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 3000;
const connectDB = require('./Database/DbConfig.js');
connectDB(); // Connect to MongoDB

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Initialize Socket Manager
const socketManager = require('./Utils/SocketManager');
socketManager.initialize(io);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join a room for specific order updates
  socket.on('joinOrderRoom', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined room: order_${orderId}`);
  });
  
  // Join kitchen room for all order updates
  socket.on('joinKitchen', () => {
    socket.join('kitchen');
    console.log(`Socket ${socket.id} joined kitchen room`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Import routers
const authRouter = require('./Router/AuthRouter.js');
const menuRouter = require('./Router/MenuRouter.js');
const orderRouter = require('./Router/OrderRouter.js');
const tableRouter = require('./Router/TableRouter.js');

// Use routers
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/tables', tableRouter);

// Use HTTP server instead of Express app for Socket.io
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});