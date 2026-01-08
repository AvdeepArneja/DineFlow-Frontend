import { io } from 'socket.io-client';

/**
 * Socket.io Client Utility
 * Manages real-time connection for notifications and order updates
 */

let socket = null;

/**
 * Initialize Socket.io connection
 * @param {string} token - JWT authentication token
 * @returns {Socket} Socket.io client instance
 */
export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket; // Already connected
  }

  const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

  socket = io(serverUrl, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Socket.io connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.io disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Socket.io reconnected after ${attemptNumber} attempts`);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Socket.io reconnection attempt ${attemptNumber}`);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Socket.io reconnection failed');
  });

  return socket;
};

/**
 * Disconnect Socket.io
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get current Socket.io instance
 * @returns {Socket|null} Socket.io client instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Listen for new order notifications (for restaurant owners)
 * @param {Function} callback - Callback function to handle new order
 */
export const onNewOrder = (callback) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket() first.');
    return;
  }
  socket.on('new_order', callback);
};

/**
 * Listen for order updates (for restaurant owners)
 * @param {Function} callback - Callback function to handle order update
 */
export const onOrderUpdate = (callback) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket() first.');
    return;
  }
  socket.on('order_update', callback);
};

/**
 * Remove listener for new order
 * @param {Function} callback - Callback function that was registered
 */
export const offNewOrder = (callback) => {
  if (socket) {
    socket.off('new_order', callback);
  }
};

/**
 * Remove listener for order update
 * @param {Function} callback - Callback function that was registered
 */
export const offOrderUpdate = (callback) => {
  if (socket) {
    socket.off('order_update', callback);
  }
};

/**
 * Remove all listeners
 */
export const removeAllListeners = () => {
  if (socket) {
    socket.removeAllListeners();
  }
};
