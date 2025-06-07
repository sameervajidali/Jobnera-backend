// // backend/server.js
// import mongoose from 'mongoose';
// import app      from './src/app.js';

// const PORT = process.env.PORT||5000;
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true, useUnifiedTopology: true
// })
//   .then(() => {
//     console.log('📦 MongoDB connected');
//     app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
//   })
//   .catch(err => {
//     console.error('❌ Connection error:', err);
//     process.exit(1);
//   });

// // graceful shutdown…
// process.on('SIGINT', () => {
//   mongoose.connection.close(() => {
//     console.log('🛑 MongoDB disconnected');
//     process.exit(0);
//   });
// });




// backend/server.js
import 'dotenv/config';                    // Load .env variables
import http from 'http';
import mongoose from 'mongoose';
import { Server as IOServer } from 'socket.io';
import dns from 'node:dns';

import app from './src/app.js';
import sessionMiddleware from './src/middlewares/session.js';
import { handleNotificationSockets } from './src/services/notificationSockets.js';
import setupChangeStreams from './src/services/changeStreamListeners.js';

dns.setDefaultResultOrder('ipv4first');  // Ensure IPv4-first DNS resolution

const PORT = process.env.PORT || 5000;


// Silence Mongoose strictQuery deprecation warning
mongoose.set('strictQuery', true);


// Create HTTP server from your Express app
const server = http.createServer(app);

// Attach Socket.IO with CORS options
const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }
});

// Share Express session with Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Wire up notification socket handlers
handleNotificationSockets(io);

// Connect to MongoDB and start listening
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('📦 MongoDB connected');

      // Start watching for DB changes
    setupChangeStreams();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server & Socket.IO listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Mongo connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down…');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('🔌 MongoDB disconnected');
      process.exit(0);
    });
  });
});