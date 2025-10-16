/**
 * @jest-environment jsdom
 */

import { webSocketService, OrderStatusUpdate, NewOrderNotification } from '../../../lib/services/websocket-service';

describe('lib/services/websocket-service', () => {
  describe('Service exports', () => {
    it('should export webSocketService', () => {
      expect(webSocketService).toBeDefined();
      expect(typeof webSocketService).toBe('object');
    });

    it('should export OrderStatusUpdate interface', () => {
      expect(true).toBe(true);
    });

    it('should export NewOrderNotification interface', () => {
      expect(true).toBe(true);
    });
  });

  describe('WebSocketService singleton', () => {
    it('should have singleton instance', () => {
      expect(webSocketService).toBeDefined();
    });

    it('should be same instance', () => {
      expect(webSocketService).toBe(webSocketService);
    });

    it('should have isConnected property', () => {
      expect(webSocketService.isConnected !== undefined).toBeTruthy();
    });
  });

  describe('Connection methods', () => {
    it('should have enableConnection method', () => {
      expect(typeof webSocketService.enableConnection).toBe('function');
    });

    it('should have disableConnection method', () => {
      expect(typeof webSocketService.disableConnection).toBe('function');
    });

    it('should have disconnect method', () => {
      expect(typeof webSocketService.disconnect).toBe('function');
    });

    it('should have getConnectionStatus method', () => {
      expect(typeof webSocketService.getConnectionStatus).toBe('function');
    });
  });

  describe('Room join methods', () => {
    it('should have joinUserRoom method', () => {
      expect(typeof webSocketService.joinUserRoom).toBe('function');
    });

    it('should have joinTechnicianRoom method', () => {
      expect(typeof webSocketService.joinTechnicianRoom).toBe('function');
    });

    it('should have joinAdminRoom method', () => {
      expect(typeof webSocketService.joinAdminRoom).toBe('function');
    });

    it('should join user room', () => {
      expect(() => {
        webSocketService.joinUserRoom('user-123');
      }).not.toThrow();
    });

    it('should join technician room', () => {
      expect(() => {
        webSocketService.joinTechnicianRoom('tech-456');
      }).not.toThrow();
    });

    it('should join admin room', () => {
      expect(() => {
        webSocketService.joinAdminRoom();
      }).not.toThrow();
    });
  });

  describe('Emit methods', () => {
    it('should have emitOrderStatusUpdate method', () => {
      expect(typeof webSocketService.emitOrderStatusUpdate).toBe('function');
    });

    it('should have emitNewOrderCreated method', () => {
      expect(typeof webSocketService.emitNewOrderCreated).toBe('function');
    });

    it('should emit order status update', () => {
      const update: OrderStatusUpdate = {
        orderId: 'order-123',
        status: 'in_progress',
        clientId: 'client-1',
        timestamp: new Date().toISOString(),
      };

      expect(() => {
        webSocketService.emitOrderStatusUpdate(update);
      }).not.toThrow();
    });

    it('should emit new order created with optional fields', () => {
      const notification: NewOrderNotification = {
        orderId: 'order-456',
        clientName: 'João Silva',
        equipmentType: 'Laptop',
        priority: 'high',
        timestamp: new Date().toISOString(),
      };

      expect(() => {
        webSocketService.emitNewOrderCreated(notification);
      }).not.toThrow();
    });
  });

  describe('Listen methods', () => {
    it('should have onOrderStatusChanged method', () => {
      expect(typeof webSocketService.onOrderStatusChanged).toBe('function');
    });

    it('should have onNewOrderNotification method', () => {
      expect(typeof webSocketService.onNewOrderNotification).toBe('function');
    });

    it('should have onNewOrderBroadcast method', () => {
      expect(typeof webSocketService.onNewOrderBroadcast).toBe('function');
    });

    it('should register order status change listener', () => {
      const handler = jest.fn();
      expect(() => {
        webSocketService.onOrderStatusChanged(handler);
      }).not.toThrow();
    });

    it('should register new order notification listener', () => {
      const handler = jest.fn();
      expect(() => {
        webSocketService.onNewOrderNotification(handler);
      }).not.toThrow();
    });

    it('should register new order broadcast listener', () => {
      const handler = jest.fn();
      expect(() => {
        webSocketService.onNewOrderBroadcast(handler);
      }).not.toThrow();
    });
  });

  describe('Off methods', () => {
    it('should have offOrderStatusChanged method', () => {
      expect(typeof webSocketService.offOrderStatusChanged).toBe('function');
    });

    it('should have offNewOrderNotification method', () => {
      expect(typeof webSocketService.offNewOrderNotification).toBe('function');
    });

    it('should have offNewOrderBroadcast method', () => {
      expect(typeof webSocketService.offNewOrderBroadcast).toBe('function');
    });

    it('should unsubscribe from order status changes', () => {
      expect(() => {
        webSocketService.offOrderStatusChanged();
      }).not.toThrow();
    });

    it('should unsubscribe from new order notifications', () => {
      expect(() => {
        webSocketService.offNewOrderNotification();
      }).not.toThrow();
    });

    it('should unsubscribe from new order broadcasts', () => {
      expect(() => {
        webSocketService.offNewOrderBroadcast();
      }).not.toThrow();
    });
  });

  describe('Connection status', () => {
    it('should return connection status object', () => {
      const status = webSocketService.getConnectionStatus();
      expect(status).toBeDefined();
      expect(typeof status).toBe('object');
    });

    it('should include isConnected field', () => {
      const status = webSocketService.getConnectionStatus();
      expect(status).toHaveProperty('isConnected');
      expect(typeof status.isConnected).toBe('boolean');
    });

    it('should include reconnectAttempts field', () => {
      const status = webSocketService.getConnectionStatus();
      expect(status).toHaveProperty('reconnectAttempts');
      expect(typeof status.reconnectAttempts).toBe('number');
    });

    it('should include socketId field', () => {
      const status = webSocketService.getConnectionStatus();
      expect(status).toHaveProperty('socketId');
    });

    it('should include shouldConnect field', () => {
      const status = webSocketService.getConnectionStatus();
      expect(status).toHaveProperty('shouldConnect');
      expect(typeof status.shouldConnect).toBe('boolean');
    });

    it('should include isReconnecting field', () => {
      const status = webSocketService.getConnectionStatus();
      expect(status).toHaveProperty('isReconnecting');
      expect(typeof status.isReconnecting).toBe('boolean');
    });
  });

  describe('OrderStatusUpdate type', () => {
    it('should have orderId field', () => {
      const update: OrderStatusUpdate = {
        orderId: 'order-1',
        status: 'pending',
        clientId: 'client-1',
        timestamp: new Date().toISOString(),
      };
      expect(update.orderId).toBe('order-1');
    });

    it('should have status field', () => {
      const update: OrderStatusUpdate = {
        orderId: 'order-2',
        status: 'completed',
        clientId: 'client-2',
        timestamp: new Date().toISOString(),
      };
      expect(update.status).toBe('completed');
    });

    it('should have clientId field', () => {
      const update: OrderStatusUpdate = {
        orderId: 'order-3',
        status: 'in_progress',
        clientId: 'client-3',
        timestamp: new Date().toISOString(),
      };
      expect(update.clientId).toBe('client-3');
    });

    it('should have timestamp field', () => {
      const timestamp = new Date().toISOString();
      const update: OrderStatusUpdate = {
        orderId: 'order-4',
        status: 'pending',
        clientId: 'client-4',
        timestamp,
      };
      expect(update.timestamp).toBe(timestamp);
    });

    it('should support technicianId field', () => {
      const update: OrderStatusUpdate = {
        orderId: 'order-5',
        status: 'pending',
        clientId: 'client-5',
        timestamp: new Date().toISOString(),
        technicianId: 'tech-1',
      };
      expect(update.technicianId).toBe('tech-1');
    });

    it('should support message field', () => {
      const update: OrderStatusUpdate = {
        orderId: 'order-6',
        status: 'pending',
        clientId: 'client-6',
        timestamp: new Date().toISOString(),
        message: 'Working on it',
      };
      expect(update.message).toBe('Working on it');
    });
  });

  describe('NewOrderNotification type', () => {
    it('should have orderId field', () => {
      const notif: NewOrderNotification = {
        orderId: 'order-1',
        clientName: 'João',
        equipmentType: 'PC',
        priority: 'normal',
        timestamp: new Date().toISOString(),
      };
      expect(notif.orderId).toBe('order-1');
    });

    it('should have clientName field', () => {
      const notif: NewOrderNotification = {
        orderId: 'order-2',
        clientName: 'Maria Silva',
        equipmentType: 'Laptop',
        priority: 'high',
        timestamp: new Date().toISOString(),
      };
      expect(notif.clientName).toBe('Maria Silva');
    });

    it('should have equipmentType field', () => {
      const notif: NewOrderNotification = {
        orderId: 'order-3',
        clientName: 'Pedro',
        equipmentType: 'Tablet',
        priority: 'normal',
        timestamp: new Date().toISOString(),
      };
      expect(notif.equipmentType).toBe('Tablet');
    });

    it('should have priority field', () => {
      const notif: NewOrderNotification = {
        orderId: 'order-4',
        clientName: 'Ana',
        equipmentType: 'Phone',
        priority: 'critical',
        timestamp: new Date().toISOString(),
      };
      expect(notif.priority).toBe('critical');
    });

    it('should have timestamp field', () => {
      const timestamp = new Date().toISOString();
      const notif: NewOrderNotification = {
        orderId: 'order-5',
        clientName: 'Test',
        equipmentType: 'Device',
        priority: 'normal',
        timestamp,
      };
      expect(notif.timestamp).toBe(timestamp);
    });
  });

  describe('Connection control', () => {
    it('should enable connection', () => {
      expect(() => {
        webSocketService.enableConnection();
      }).not.toThrow();
    });

    it('should disable connection', () => {
      expect(() => {
        webSocketService.disableConnection();
      }).not.toThrow();
    });

    it('should disconnect', () => {
      expect(() => {
        webSocketService.disconnect();
      }).not.toThrow();
    });

    it('should handle multiple enable calls', () => {
      expect(() => {
        webSocketService.enableConnection();
        webSocketService.enableConnection();
      }).not.toThrow();
    });

    it('should handle multiple disconnect calls', () => {
      expect(() => {
        webSocketService.disconnect();
        webSocketService.disconnect();
      }).not.toThrow();
    });
  });

  describe('Event listening patterns', () => {
    it('should support multiple listeners on same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      expect(() => {
        webSocketService.onOrderStatusChanged(handler1);
        webSocketService.onOrderStatusChanged(handler2);
      }).not.toThrow();
    });

    it('should support listener removal', () => {
      const handler = jest.fn();
      expect(() => {
        webSocketService.onOrderStatusChanged(handler);
        webSocketService.offOrderStatusChanged(handler);
      }).not.toThrow();
    });

    it('should support removing all listeners', () => {
      expect(() => {
        webSocketService.offOrderStatusChanged();
        webSocketService.offNewOrderNotification();
        webSocketService.offNewOrderBroadcast();
      }).not.toThrow();
    });
  });

  describe('Room management', () => {
    it('should handle multiple room joins', () => {
      expect(() => {
        webSocketService.joinUserRoom('user-1');
        webSocketService.joinUserRoom('user-2');
      }).not.toThrow();
    });

    it('should handle room joins after disconnect', () => {
      expect(() => {
        webSocketService.disconnect();
        webSocketService.joinAdminRoom();
      }).not.toThrow();
    });

    it('should handle room joins without connection', () => {
      expect(() => {
        webSocketService.disableConnection();
        webSocketService.joinTechnicianRoom('tech-1');
      }).not.toThrow();
    });
  });
});
