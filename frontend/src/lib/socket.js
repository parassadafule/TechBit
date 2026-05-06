import { io } from 'socket.io-client';

const isLocalHost = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isLocalHost ? 'http://localhost:8000' : window.location.origin);

class SocketService {
  constructor() {
    this.socket = null;
    this.currentUserId = null;
  }

  connect(userId) {
    this.currentUserId = userId || this.currentUserId;

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        if (this.currentUserId) {
          this.socket.emit('join', this.currentUserId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });
    } else if (this.socket.connected && this.currentUserId) {
      this.socket.emit('join', this.currentUserId);
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (this.currentUserId) {
        this.socket.emit('leave', this.currentUserId);
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
  }

  joinPost(postId) {
    if (this.socket) {
      this.socket.emit('join-post', postId);
    }
  }

  leavePost(postId) {
    if (this.socket) {
      this.socket.emit('leave-post', postId);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
