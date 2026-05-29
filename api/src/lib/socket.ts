import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { corsOrigins, env } from "../config/env.js";

let io: Server | null = null;

function corsAllowed(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (env.NODE_ENV === "development" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    callback(null, true);
    return;
  }
  if (corsOrigins.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`CORS blocked for origin: ${origin}`));
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: corsAllowed,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join:cafe", (cafeId: string) => {
      if (cafeId) socket.join(`cafe:${cafeId}`);
    });
    socket.on("join:order", (orderToken: string) => {
      if (orderToken) socket.join(`order:${orderToken}`);
    });
    socket.on("leave:cafe", (cafeId: string) => {
      if (cafeId) socket.leave(`cafe:${cafeId}`);
    });
    socket.on("leave:order", (orderToken: string) => {
      if (orderToken) socket.leave(`order:${orderToken}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitOrderEvent(
  cafeId: string,
  orderToken: string,
  event: "order:new" | "order:updated",
  payload: unknown,
) {
  getIO().to(`cafe:${cafeId}`).to(`order:${orderToken}`).emit(event, payload);
}
