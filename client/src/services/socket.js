import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const socket = io(SOCKET_URL, {
    withCredentials: true,
    secure: true,
    autoConnect: false,
    reconnection: true,
});

export default socket;
