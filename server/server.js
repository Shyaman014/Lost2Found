import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initializeSocket } from './config/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Connect to Database
connectDB().then(() => {
  // Start server only if DB connection is successful
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
