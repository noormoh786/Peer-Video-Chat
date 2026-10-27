const app = require('express')();
const server = require('http').createServer(app);
const cors = require('cors');

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

// 5001 by default: on macOS, port 5000 is taken by the AirPlay Receiver,
// which makes the server fail to start with EADDRINUSE.
const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
  res.send('Peer video chat signaling server is running.');
});

// socket.id -> peer socket.id currently in a call with
const pairs = new Map();

const link = (a, b) => {
  if (!a || !b) return;
  pairs.set(a, b);
  pairs.set(b, a);
};

const unlink = (a) => {
  const b = pairs.get(a);
  if (b) pairs.delete(b);
  pairs.delete(a);
  return b;
};

io.on('connection', (socket) => {
  socket.emit('me', socket.id);

  socket.on('calluser', ({ to, signal, from, name }) => {
    io.to(to).emit('calluser', { signal, from, name });
  });

  socket.on('answercall', ({ to, signal, name }) => {
    link(socket.id, to);
    io.to(to).emit('callaccepted', { signal, name });
  });

  // Trickle ICE relay
  socket.on('icecandidate', ({ to, candidate }) => {
    io.to(to).emit('icecandidate', candidate);
  });

  socket.on('rejectcall', ({ to }) => {
    io.to(to).emit('callrejected');
  });

  socket.on('endcall', ({ to }) => {
    unlink(socket.id);
    io.to(to).emit('callended');
  });

  socket.on('disconnect', () => {
    const peer = unlink(socket.id);
    if (peer) io.to(peer).emit('callended');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
