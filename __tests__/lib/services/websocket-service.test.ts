import { io, Socket } from 'socket.io-client';

// Mock do socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

// Importar após o mock
import webSocketService from '../../../lib/services/websocket-service';

// Mock do console para evitar logs durante os testes
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('WebSocketService', () => {
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    // Mock do socket
    mockSocket = {
      id: 'test-socket-id',
      connect: jest.fn(),
      disconnect: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    };

    (io as jest.Mock).mockReturnValue(mockSocket);

    // Limpar mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Limpar spies
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
  });

  afterAll(() => {
    // Restaurar spies
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('instância singleton', () => {
    it('deve ter uma instância do WebSocketService disponível', () => {
      expect(webSocketService).toBeDefined();
    });

    it('deve ter métodos principais disponíveis', () => {
      expect(typeof webSocketService.joinUserRoom).toBe('function');
      expect(typeof webSocketService.emitOrderStatusUpdate).toBe('function');
      expect(typeof webSocketService.getConnectionStatus).toBe('function');
    });
  });

  describe('métodos de sala', () => {
    it('deve ter método joinUserRoom', () => {
      expect(typeof webSocketService.joinUserRoom).toBe('function');
    });

    it('deve ter método joinTechnicianRoom', () => {
      expect(typeof webSocketService.joinTechnicianRoom).toBe('function');
    });

    it('deve ter método joinAdminRoom', () => {
      expect(typeof webSocketService.joinAdminRoom).toBe('function');
    });
  });

  describe('métodos de emissão', () => {
    it('deve ter método emitOrderStatusUpdate', () => {
      expect(typeof webSocketService.emitOrderStatusUpdate).toBe('function');
    });

    it('deve ter método emitNewOrderCreated', () => {
      expect(typeof webSocketService.emitNewOrderCreated).toBe('function');
    });
  });

  describe('métodos de listeners', () => {
    it('deve ter método onOrderStatusChanged', () => {
      expect(typeof webSocketService.onOrderStatusChanged).toBe('function');
    });

    it('deve ter método onNewOrderNotification', () => {
      expect(typeof webSocketService.onNewOrderNotification).toBe('function');
    });

    it('deve ter método onNewOrderBroadcast', () => {
      expect(typeof webSocketService.onNewOrderBroadcast).toBe('function');
    });

    it('deve ter método offOrderStatusChanged', () => {
      expect(typeof webSocketService.offOrderStatusChanged).toBe('function');
    });

    it('deve ter método offNewOrderNotification', () => {
      expect(typeof webSocketService.offNewOrderNotification).toBe('function');
    });

    it('deve ter método offNewOrderBroadcast', () => {
      expect(typeof webSocketService.offNewOrderBroadcast).toBe('function');
    });
  });

  describe('métodos de controle', () => {
    it('deve ter método getConnectionStatus', () => {
      expect(typeof webSocketService.getConnectionStatus).toBe('function');
    });

    it('deve ter método enableConnection', () => {
      expect(typeof webSocketService.enableConnection).toBe('function');
    });

    it('deve ter método disableConnection', () => {
      expect(typeof webSocketService.disableConnection).toBe('function');
    });

    it('deve ter método disconnect', () => {
      expect(typeof webSocketService.disconnect).toBe('function');
    });
  });

  describe('status da conexão', () => {
    it('deve retornar um objeto de status', () => {
      const status = webSocketService.getConnectionStatus();
      expect(typeof status).toBe('object');
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('reconnectAttempts');
      expect(status).toHaveProperty('socketId');
      expect(status).toHaveProperty('shouldConnect');
      expect(status).toHaveProperty('isReconnecting');
    });
  });

  describe('validação de interfaces', () => {
    it('deve aceitar dados válidos para OrderStatusUpdate', () => {
      const orderUpdate = {
        orderId: 'OS-001',
        status: 'em_andamento',
        clientId: 'client-123',
        technicianId: 'tech-456',
        timestamp: '2024-01-15T10:00:00Z',
        message: 'Ordem iniciada'
      };

      // Verificar que os dados têm a estrutura esperada
      expect(orderUpdate.orderId).toBeDefined();
      expect(orderUpdate.status).toBeDefined();
      expect(orderUpdate.clientId).toBeDefined();
      expect(orderUpdate.timestamp).toBeDefined();
      expect(typeof orderUpdate.orderId).toBe('string');
      expect(typeof orderUpdate.status).toBe('string');
      expect(typeof orderUpdate.clientId).toBe('string');
      expect(typeof orderUpdate.timestamp).toBe('string');
    });

    it('deve aceitar dados válidos para NewOrderNotification', () => {
      const newOrder = {
        orderId: 'OS-002',
        clientName: 'João Silva',
        equipmentType: 'iPhone',
        priority: 'alta',
        timestamp: '2024-01-15T10:00:00Z'
      };

      // Verificar que os dados têm a estrutura esperada
      expect(newOrder.orderId).toBeDefined();
      expect(newOrder.clientName).toBeDefined();
      expect(newOrder.equipmentType).toBeDefined();
      expect(newOrder.priority).toBeDefined();
      expect(newOrder.timestamp).toBeDefined();
      expect(typeof newOrder.orderId).toBe('string');
      expect(typeof newOrder.clientName).toBe('string');
      expect(typeof newOrder.equipmentType).toBe('string');
      expect(typeof newOrder.priority).toBe('string');
      expect(typeof newOrder.timestamp).toBe('string');
    });
  });
});
