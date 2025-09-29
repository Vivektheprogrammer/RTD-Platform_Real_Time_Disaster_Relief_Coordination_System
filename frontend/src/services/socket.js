import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    if (this.socket) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    this.socket = io(SOCKET_URL);

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinUserRoom(userId) {
    if (!this.socket || !userId) return;
    this.socket.emit('join', userId);
  }

  joinRoom(roomName) {
    if (!this.socket || !roomName) return;
    this.socket.emit('join_room', roomName);
  }

  leaveRoom(roomName) {
    if (!this.socket || !roomName) return;
    this.socket.emit('leave_room', roomName);
  }

  // Add event listener
  on(event, callback) {
    if (!this.socket) this.connect();
    
    // Store the callback in our listeners object
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    this.socket.on(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) return;
    
    if (callback && this.listeners[event]) {
      // Remove specific callback
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      // Remove all callbacks for this event
      this.listeners[event] = [];
    }
    
    this.socket.off(event, callback);
  }

  // Emit event
  emit(event, data) {
    if (!this.socket) this.connect();
    this.socket.emit(event, data);
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;