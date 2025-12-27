import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:4000';
let socket;

export const initSocket = ({ matchId, token }) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    query: {
      matchId,
    },
    auth: token ? { token } : undefined,
  });

  return socket;
};

export const getSocket = () => socket;
