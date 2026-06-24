const Doctor = require("../models/Doctor");
const { getQueueSnapshot } = require("../services/queueService");

/**
 * Register all socket event handlers.
 * On connect: send full queue snapshot so browser-refresh clients catch up.
 */
function registerSocketHandlers(io) {
  io.on("connection", async (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client sends doctorId it wants to track
    socket.on("subscribe", async ({ doctorId }) => {
      if (!doctorId) return;
      socket.join(`doctor:${doctorId}`); // optional room — we broadcast globally for simplicity
      try {
        const snapshot = await getQueueSnapshot(doctorId);
        socket.emit("queueUpdated", snapshot);
      } catch (e) {
        socket.emit("error", { message: e.message });
      }
    });

    // On disconnect, nothing needs cleanup (stateless socket)
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { registerSocketHandlers };
