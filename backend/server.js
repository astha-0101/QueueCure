require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const routes = require("./routes");
const { registerSocketHandlers } = require("./socket/handlers");

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

// Attach io to every request so controllers can emit
app.use((req, _res, next) => { req.io = io; next(); });

// Routes
app.use("/api", routes);

// Health check
app.get("/", (_req, res) => res.json({ status: "Queue Cure '26 backend running" }));

// Socket handlers
registerSocketHandlers(io);

// Connect DB then start
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB error:", err.message);
    console.log("⚠️ Starting without MongoDB");
  });

server.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server on port ${process.env.PORT || 5000}`);
});
  

module.exports = { io };
