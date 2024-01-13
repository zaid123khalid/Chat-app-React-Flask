import { io } from "socket.io-client";

class Socket {
  constructor() {
    if (!Socket.instance) {
      this.socket = io("http://localhost:5000", {
        transports: ["websocket"],
      }).connect();
      Socket.instance = this;
    }

    return Socket.instance;
  }

  getSocket() {
    return this.socket;
  }
}

const socketInstance = new Socket();
Object.freeze(socketInstance);

export default socketInstance;
