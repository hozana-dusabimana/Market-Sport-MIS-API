import { Server } from 'socket.io';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join', (userId) => {
        this.connectedUsers.set(userId, socket.id);
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room`);
      });

      socket.on('disconnect', () => {
        for (let [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }
        console.log('User disconnected:', socket.id);
      });
    });
  }

  // Payment events
  emitPaymentCreated(userId, paymentData) {
    this.io.to(`user_${userId}`).emit('payment_created', paymentData);
  }

  emitPaymentUpdated(userId, paymentData) {
    this.io.to(`user_${userId}`).emit('payment_updated', paymentData);
  }

  emitPaymentCompleted(userId, paymentData) {
    this.io.to(`user_${userId}`).emit('payment_completed', paymentData);
  }

  emitPaymentFailed(userId, paymentData) {
    this.io.to(`user_${userId}`).emit('payment_failed', paymentData);
  }

  // Notification events
  emitNotification(userId, notification) {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }

  // Allocation events
  emitAllocationCreated(userId, allocationData) {
    this.io.to(`user_${userId}`).emit('allocation_created', allocationData);
  }

  emitAllocationUpdated(userId, allocationData) {
    this.io.to(`user_${userId}`).emit('allocation_updated', allocationData);
  }
}

export default new SocketService();