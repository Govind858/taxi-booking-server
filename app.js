const express = require("express");
const userRouter = require("./User/Router/userRouter");
const driverRouter = require('./TaxiDriver/Router/driverRouter');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const pool = require('./db');
const app = express();
const port = 5000;
const cors = require('cors');
const { Socket } = require("node:dgram");

// ✅ Define this FIRST, at the top
const driverSockets = {};

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ['POST', 'GET', 'DELETE', 'UPDATE', 'PUT'],
    credentials: true
  }
});

app.use(express.json());

const checkDBConnetion = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Database connected. Server time is:', res.rows[0].now);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  }
};
checkDBConnetion();

app.use(cors({
  origin: "http://localhost:3000",
  methods: ['POST', 'GET', 'DELETE', 'UPDATE', 'PUT'],
  credentials: true
}));

// ✅ Now this works because driverSockets is already defined
app.use((req, res, next) => {
  req.io = io;
  req.driverSockets = driverSockets;
  next();
});

app.use('/user', userRouter);
app.use('/taxi-driver', driverRouter);

// ✅ Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🚖 Driver/user connected');

  socket.on('driverId', (data) => {
    const { driverId } = data;
    driverSockets[driverId] = socket.id;
    console.log(`✅ Registered driver ${driverId} with socket ID ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
    for (const [driverId, id] of Object.entries(driverSockets)) {
      if (id === socket.id) {
        delete driverSockets[driverId];
        console.log(`🧹 Removed disconnected driver ${driverId}`);
      }
    }
  });
});

server.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
