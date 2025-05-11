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

// Emit customer assistance alert to kitchen and dashboard
const emitCustomerAssistanceAlert = (alertData) => {
  if (!io) return;
  
  console.log('SocketManager: Emitting customer assistance alert', alertData);
  
  // Create a unique ID for this alert to prevent duplicates
  const alertWithId = {
    ...alertData,
    alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  // Instead of emitting to all clients AND the kitchen room (which causes duplicates),
  // we'll emit to specific rooms without overlap
  
  // Get all socket IDs
  const allSockets = Array.from(io.sockets.sockets.keys());
  
  // Get kitchen room sockets
  const kitchenRoom = io.sockets.adapter.rooms.get('kitchen');
  const kitchenSockets = kitchenRoom ? Array.from(kitchenRoom) : [];
  
  // Emit to kitchen room
  io.to('kitchen').emit('customerAssistanceAlert', alertWithId);
  
  // Log connected rooms for debugging
  const rooms = io.sockets.adapter.rooms;
  console.log('Current rooms:', Array.from(rooms.keys()));
  
  // Log if kitchen room exists
  if (rooms.has('kitchen')) {
    console.log('Kitchen room exists with', rooms.get('kitchen').size, 'clients');
  } else {
    console.log('Kitchen room does not exist');
  }
};

module.exports = {
  initialize,
  emitOrderUpdate,
  emitNewOrder,
  emitOrderStatusChange,
  emitCustomerAssistanceAlert
};
