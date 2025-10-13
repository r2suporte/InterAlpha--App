import { NextRequest } from 'next/server';

import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export const runtime = 'nodejs';

// Extend the global object to include our socket server
declare global {
  var io: SocketIOServer | undefined;
}

const SocketHandler = (req: NextRequest, res: any) => {
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
      console.log('Cliente conectado:', socket.id);

      // Join user to their specific room for targeted notifications
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`);
        console.log(`Usuário ${userId} entrou na sala user-${userId}`);
      });

      // Join technician to technician room for work order notifications
      socket.on('join-technician-room', (technicianId: string) => {
        socket.join(`technician-${technicianId}`);
        console.log(
          `Técnico ${technicianId} entrou na sala technician-${technicianId}`
        );
      });

      // Join admin to admin room for all notifications
      socket.on('join-admin-room', () => {
        socket.join('admin');
        console.log('Admin entrou na sala admin');
      });

      // Handle order status updates
      socket.on('order-status-update', data => {
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
        console.log('Nova ordem criada:', data);
        // Notify all technicians and admins
        socket.to('admin').emit('new-order-notification', data);
        global.io?.emit('new-order-broadcast', data); // Broadcast to all connected clients
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
