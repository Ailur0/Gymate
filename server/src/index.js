import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import app from './app.js';

dotenv.config();

const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  const { matchId } = socket.handshake.query;
  if (matchId) {
    socket.join(matchId);
  }

  socket.on('disconnect', () => {
    // noop for mock server
  });
});

app.set('io', io);

server.listen(port, () => {
  console.log(`Gymate API listening on port ${port}`); // eslint-disable-line no-console
});
