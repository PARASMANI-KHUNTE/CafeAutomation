// Socket.io manager for real-time updates
let io;

// Initialize the Socket.io instance
const initialize = (socketIo) => {
  io = socketIo;
};

// Emit an event to a specific order room
const emitOrderUpdate = (orderId, order) => {
  if (!io) return;
  
  // Emit to the specific order room (for customers)
  io.to(`order_${orderId}`).emit('orderUpdated', order);
  
  // Also emit to the kitchen room (for staff)
  io.to('kitchen').emit('orderUpdated', order);
};

// Emit a new order event to the kitchen
const emitNewOrder = (order) => {
  if (!io) return;
  io.to('kitchen').emit('newOrder', order);
};

// Emit order status change to all connected clients
const emitOrderStatusChange = (orderId, status) => {
  if (!io) return;
  io.emit('orderStatusChanged', { orderId, status });
};

module.exports = {
  initialize,
  emitOrderUpdate,
  emitNewOrder,
  emitOrderStatusChange
};
