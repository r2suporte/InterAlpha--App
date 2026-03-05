import { NextRequest } from 'next/server';

import { Server as NetServer } from 'http';
import { verify } from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { getJwtSecret } from '@/lib/auth/jwt-secret';

export const runtime = 'nodejs';

// Extend the global object to include our socket server
declare global {
  var io: SocketIOServer | undefined;
}

interface SocketAuthPayload {
  userId?: string;
  clienteId?: string;
  role?: string;
  tipo?: string;
}

interface SocketAuthContext extends SocketAuthPayload {
  authenticated: boolean;
}

const PRIVILEGED_ROLES = new Set([
  'admin',
  'diretor',
  'gerente_adm',
  'supervisor_tecnico',
]);

function parseCookieValue(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(';');
  for (const item of cookies) {
    const [rawKey, ...rawValue] = item.trim().split('=');
    if (rawKey === name) {
      return rawValue.join('=');
    }
  }
  return null;
}

function extractTokenFromHandshake(socket: any): string | null {
  const authToken = socket.handshake?.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }

  const authorization = socket.handshake?.headers?.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '');
  }

  const cookieHeader = socket.handshake?.headers?.cookie;
  if (typeof cookieHeader !== 'string') {
    return null;
  }

  return (
    parseCookieValue(cookieHeader, 'auth-token') ||
    parseCookieValue(cookieHeader, 'cliente-token')
  );
}

function buildSocketAuthContext(socket: any): SocketAuthContext {
  const token = extractTokenFromHandshake(socket);
  if (!token) {
    return { authenticated: false };
  }

  try {
    const payload = verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    }) as SocketAuthPayload;

    return {
      authenticated: true,
      userId: payload.userId,
      clienteId: payload.clienteId,
      role: payload.role,
      tipo: payload.tipo,
    };
  } catch {
    return { authenticated: false };
  }
}

function isPrivileged(context: SocketAuthContext): boolean {
  return Boolean(context.role && PRIVILEGED_ROLES.has(context.role));
}

function canJoinUserRoom(
  context: SocketAuthContext,
  requestedUserId: string
): boolean {
  if (!context.authenticated) return false;

  if (context.tipo === 'cliente') {
    return context.clienteId === requestedUserId;
  }

  if (isPrivileged(context)) {
    return true;
  }

  return context.userId === requestedUserId;
}

function canJoinTechnicianRoom(
  context: SocketAuthContext,
  requestedTechnicianId: string
): boolean {
  if (!context.authenticated) return false;

  if (isPrivileged(context)) {
    return true;
  }

  return context.role === 'technician' && context.userId === requestedTechnicianId;
}

function canEmitOperationalEvents(context: SocketAuthContext): boolean {
  return isPrivileged(context) || context.role === 'technician';
}

const SocketHandler = (_req: NextRequest, res: any) => {
  if (!global.io) {
    console.log('Inicializando servidor Socket.IO...');

    // Create HTTP server from Next.js server
    const httpServer: NetServer = res.socket.server;

    // Create Socket.IO server
    global.io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin:
          process.env.NODE_ENV === 'production'
            ? process.env.NEXT_PUBLIC_APP_URL
            : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    global.io.on('connection', socket => {
      const authContext = buildSocketAuthContext(socket);
      socket.data.authContext = authContext;

      if (!authContext.authenticated) {
        socket.emit('auth-error', {
          error: 'Não autorizado para conexão WebSocket',
        });
        socket.disconnect(true);
        return;
      }

      console.log('Cliente conectado:', socket.id);

      // Join user to their specific room for targeted notifications
      socket.on('join-user-room', (userId: string) => {
        if (!canJoinUserRoom(authContext, userId)) {
          socket.emit('forbidden', { action: 'join-user-room' });
          return;
        }

        socket.join(`user-${userId}`);
        console.log(`Usuário ${userId} entrou na sala user-${userId}`);
      });

      // Join technician to technician room for work order notifications
      socket.on('join-technician-room', (technicianId: string) => {
        if (!canJoinTechnicianRoom(authContext, technicianId)) {
          socket.emit('forbidden', { action: 'join-technician-room' });
          return;
        }

        socket.join(`technician-${technicianId}`);
        console.log(
          `Técnico ${technicianId} entrou na sala technician-${technicianId}`
        );
      });

      // Join admin to admin room for all notifications
      socket.on('join-admin-room', () => {
        if (!isPrivileged(authContext)) {
          socket.emit('forbidden', { action: 'join-admin-room' });
          return;
        }

        socket.join('admin');
        console.log('Admin entrou na sala admin');
      });

      // Handle order status updates
      socket.on('order-status-update', data => {
        if (!canEmitOperationalEvents(authContext)) {
          socket.emit('forbidden', { action: 'order-status-update' });
          return;
        }

        console.log('Atualização de status da ordem:', data);
        // Broadcast to relevant rooms
        socket.to(`user-${data.clientId}`).emit('order-status-changed', data);
        socket
          .to(`technician-${data.technicianId}`)
          .emit('order-status-changed', data);
        socket.to('admin').emit('order-status-changed', data);
      });

      // Handle new order creation
      socket.on('new-order-created', data => {
        if (!canEmitOperationalEvents(authContext)) {
          socket.emit('forbidden', { action: 'new-order-created' });
          return;
        }

        console.log('Nova ordem criada:', data);
        // Notify admins only; clients must join authorized rooms explicitly
        socket.to('admin').emit('new-order-notification', data);
      });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
      });
    });

    console.log('Servidor Socket.IO configurado');
  } else {
    console.log('Servidor Socket.IO já está rodando');
  }

  res.end();
};

export { SocketHandler as GET, SocketHandler as POST };
