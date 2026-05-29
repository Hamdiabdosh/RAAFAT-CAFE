import { io, type Socket } from "socket.io-client";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(baseURL, { transports: ["websocket", "polling"] });
  }
  return socket;
}

export function joinCafeRoom(cafeId: string) {
  getSocket().emit("join:cafe", cafeId);
}

export function leaveCafeRoom(cafeId: string) {
  getSocket().emit("leave:cafe", cafeId);
}

export function joinOrderRoom(orderToken: string) {
  getSocket().emit("join:order", orderToken);
}

export function leaveOrderRoom(orderToken: string) {
  getSocket().emit("leave:order", orderToken);
}
