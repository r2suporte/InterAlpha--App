import { Socket, io } from 'socket.io-client';
import { logger } from './logger-service';

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
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private isReconnecting = false;
  private shouldConnect = true;

  constructor() {
    // Só conecta se estiver no browser e em desenvolvimento
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      this.connect();
    }
  }

  private connect() {
    if (!this.shouldConnect || this.isReconnecting) {
      return;
    }

    try {
      this.socket = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 10000,
        autoConnect: false, // Controle manual da conexão
      });

      this.setupEventListeners();
      this.socket.connect();
    } catch (error) {
      logger.error('Erro ao conectar WebSocket:', error as Error);
      this.handleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('WebSocket conectado:', { socketId: this.socket?.id });
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', reason => {
      logger.info('WebSocket desconectado:', { reason });
      this.isConnected = false;

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', error => {
      logger.error('Erro de conexão WebSocket:', error);
      this.isConnected = false;
      this.handleReconnect();
    });

    this.socket.on('reconnect', attemptNumber => {
      logger.info('WebSocket reconectado', { attemptNumber });
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isReconnecting || !this.shouldConnect) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.warn('Máximo de tentativas de reconexão atingido. WebSocket desabilitado.');
        this.shouldConnect = false;
      }
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    logger.info(
      `Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.isConnected && this.shouldConnect) {
        this.isReconnecting = false;
        this.connect();
      } else {
        this.isReconnecting = false;
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
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
      shouldConnect: this.shouldConnect,
      isReconnecting: this.isReconnecting,
    };
  }

  // Enable WebSocket connection
  enableConnection() {
    this.shouldConnect = true;
    this.reconnectAttempts = 0;
    if (!this.isConnected && typeof window !== 'undefined') {
      this.connect();
    }
  }

  // Disable WebSocket connection
  disableConnection() {
    this.shouldConnect = false;
    this.disconnect();
  }

  // Disconnect and cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isReconnecting = false;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
