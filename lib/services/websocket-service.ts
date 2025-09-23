import { io, Socket } from 'socket.io-client';

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  clientId: string;
  technicianId?: string;
  timestamp: string;
  message?: string;
}

export interface NewOrderNotification {
  orderId: string;
  clientName: string;
  equipmentType: string;
  priority: string;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.socket = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket conectado:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket desconectado:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão WebSocket:', error);
      this.isConnected = false;
      this.handleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconectado após', attemptNumber, 'tentativas');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  // Join user-specific room for notifications
  joinUserRoom(userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-user-room', userId);
    }
  }

  // Join technician room for work order notifications
  joinTechnicianRoom(technicianId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-technician-room', technicianId);
    }
  }

  // Join admin room for all notifications
  joinAdminRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-admin-room');
    }
  }

  // Emit order status update
  emitOrderStatusUpdate(data: OrderStatusUpdate) {
    if (this.socket && this.isConnected) {
      this.socket.emit('order-status-update', data);
    }
  }

  // Emit new order creation
  emitNewOrderCreated(data: NewOrderNotification) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new-order-created', data);
    }
  }

  // Listen for order status changes
  onOrderStatusChanged(callback: (data: OrderStatusUpdate) => void) {
    if (this.socket) {
      this.socket.on('order-status-changed', callback);
    }
  }

  // Listen for new order notifications
  onNewOrderNotification(callback: (data: NewOrderNotification) => void) {
    if (this.socket) {
      this.socket.on('new-order-notification', callback);
    }
  }

  // Listen for new order broadcasts (for all users)
  onNewOrderBroadcast(callback: (data: NewOrderNotification) => void) {
    if (this.socket) {
      this.socket.on('new-order-broadcast', callback);
    }
  }

  // Remove event listeners
  offOrderStatusChanged(callback?: (data: OrderStatusUpdate) => void) {
    if (this.socket) {
      this.socket.off('order-status-changed', callback);
    }
  }

  offNewOrderNotification(callback?: (data: NewOrderNotification) => void) {
    if (this.socket) {
      this.socket.off('new-order-notification', callback);
    }
  }

  offNewOrderBroadcast(callback?: (data: NewOrderNotification) => void) {
    if (this.socket) {
      this.socket.off('new-order-broadcast', callback);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;