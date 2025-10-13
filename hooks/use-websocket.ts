import { useCallback, useEffect, useState } from 'react';

import webSocketService, {
  NewOrderNotification,
  OrderStatusUpdate,
} from '@/lib/services/websocket-service';

interface UseWebSocketOptions {
  userId?: string;
  technicianId?: string;
  isAdmin?: boolean;
}

interface WebSocketState {
  isConnected: boolean;
  socketId?: string;
  reconnectAttempts: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    reconnectAttempts: 0,
  });

  const [orderStatusUpdates, setOrderStatusUpdates] = useState<
    OrderStatusUpdate[]
  >([]);
  const [newOrderNotifications, setNewOrderNotifications] = useState<
    NewOrderNotification[]
  >([]);

  // Update connection state
  const updateConnectionState = useCallback(() => {
    try {
      const status = webSocketService.getConnectionStatus();
      setState({
        isConnected: status.isConnected,
        socketId: status.socketId,
        reconnectAttempts: status.reconnectAttempts,
      });
    } catch (error) {
      console.warn('Erro ao atualizar estado do WebSocket:', error);
      setState({
        isConnected: false,
        reconnectAttempts: 0,
      });
    }
  }, []);

  // Join appropriate rooms based on user role
  useEffect(() => {
    const { userId, technicianId, isAdmin } = options;

    if (userId) {
      webSocketService.joinUserRoom(userId);
    }

    if (technicianId) {
      webSocketService.joinTechnicianRoom(technicianId);
    }

    if (isAdmin) {
      webSocketService.joinAdminRoom();
    }

    // Update connection state periodically
    const interval = setInterval(updateConnectionState, 1000);
    updateConnectionState(); // Initial update

    return () => {
      clearInterval(interval);
    };
  }, [
    options.userId,
    options.technicianId,
    options.isAdmin,
    updateConnectionState,
  ]);

  // Handle order status updates
  useEffect(() => {
    const handleOrderStatusUpdate = (data: OrderStatusUpdate) => {
      setOrderStatusUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates
    };

    webSocketService.onOrderStatusChanged(handleOrderStatusUpdate);

    return () => {
      webSocketService.offOrderStatusChanged(handleOrderStatusUpdate);
    };
  }, []);

  // Handle new order notifications
  useEffect(() => {
    const handleNewOrderNotification = (data: NewOrderNotification) => {
      setNewOrderNotifications(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 notifications
    };

    const handleNewOrderBroadcast = (data: NewOrderNotification) => {
      setNewOrderNotifications(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 notifications
    };

    webSocketService.onNewOrderNotification(handleNewOrderNotification);
    webSocketService.onNewOrderBroadcast(handleNewOrderBroadcast);

    return () => {
      webSocketService.offNewOrderNotification(handleNewOrderNotification);
      webSocketService.offNewOrderBroadcast(handleNewOrderBroadcast);
    };
  }, []);

  // Emit order status update
  const emitOrderStatusUpdate = useCallback((data: OrderStatusUpdate) => {
    try {
      webSocketService.emitOrderStatusUpdate(data);
    } catch (error) {
      console.warn('Erro ao emitir atualização de status:', error);
    }
  }, []);

  // Emit new order creation
  const emitNewOrderCreated = useCallback((data: NewOrderNotification) => {
    try {
      webSocketService.emitNewOrderCreated(data);
    } catch (error) {
      console.warn('Erro ao emitir nova ordem:', error);
    }
  }, []);

  // Clear notifications
  const clearOrderStatusUpdates = useCallback(() => {
    setOrderStatusUpdates([]);
  }, []);

  const clearNewOrderNotifications = useCallback(() => {
    setNewOrderNotifications([]);
  }, []);

  // Get latest notification of each type
  const latestOrderStatusUpdate = orderStatusUpdates[0] || null;
  const latestNewOrderNotification = newOrderNotifications[0] || null;

  return {
    // Connection state
    isConnected: state.isConnected,
    socketId: state.socketId,
    reconnectAttempts: state.reconnectAttempts,

    // Notifications
    orderStatusUpdates,
    newOrderNotifications,
    latestOrderStatusUpdate,
    latestNewOrderNotification,

    // Actions
    emitOrderStatusUpdate,
    emitNewOrderCreated,
    clearOrderStatusUpdates,
    clearNewOrderNotifications,

    // Connection info
    connectionStatus: state,
  };
}

export default useWebSocket;
