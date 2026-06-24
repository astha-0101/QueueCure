import { io } from "socket.io-client";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const socket = io(BACKEND, { autoConnect: true, reconnectionAttempts: 10, reconnectionDelay: 1000 });

export default socket;
