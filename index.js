import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // allow Vite dev-server
});

const PORT = process.env.PORT || 3001;

io.on('connection', socket => {
  console.log(`[IO] user connected ${socket.id}`);

  /* ---------- Core WebRTC signaling ---------- */
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId); // Socket.IO room
    socket.to(roomId).emit('user-connected', userId); // notify others
    console.log(`[IO] ${userId} joined room ${roomId}`);
  });

  socket.on('send-offer', (payload) => {
    // payload = { target, caller, offer }
    socket.to(payload.target).emit('receive-offer', payload);
  });

  socket.on('send-answer', (payload) => {
    // payload = { target, caller, answer }
    socket.to(payload.target).emit('receive-answer', payload);
  });

  socket.on('send-ice', (payload) => {
    // payload = { target, candidate }
    socket.to(payload.target).emit('receive-ice', payload);
  });

  /* ---------- Chat ---------- */
  socket.on('send-message', ({ roomId, message, senderId }) => {
    socket.to(roomId).emit('receive-message', { senderId, message });
  });

  /* ---------- Disconnect ---------- */
  socket.on('disconnect', () => {
    console.log(`[IO] user disconnected ${socket.id}`);
    // broadcast to all rooms this socket belonged to
    socket.rooms.forEach(room =>
      socket.to(room).emit('user-disconnected', socket.id)
    );
  });
});

server.listen(PORT, () => console.log(`[SERVER] listening on ${PORT}`));
