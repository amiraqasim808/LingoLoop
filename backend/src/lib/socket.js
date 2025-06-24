import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Track active connections { userId: socketId }
const onlineUsers = {};

// Helper to retrieve socket ID for a user
export function getReceiverSocketId(userId) {
  return onlineUsers[userId];
}

io.on("connection", (socket) => {
  console.log("🔌 New socket connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers[userId] = socket.id;
  }

  // Broadcast updated user list
  io.emit("getOnlineUsers", Object.keys(onlineUsers));

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    delete onlineUsers[userId];
    io.emit("getOnlineUsers", Object.keys(onlineUsers));
  });
});

export { io, app, server };
