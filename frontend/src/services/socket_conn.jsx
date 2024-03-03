import { io } from "socket.io-client";

class Socket {
  constructor() {
    if (!Socket.instance) {
      this.socket = io("http://localhost:5000", {
        transports: ["websocket"],
        autoConnect: false,
        query: {
          token: localStorage.getItem("token"),
        },
      });
      Socket.instance = this;
    }

    return Socket.instance;
  }

  setToken(token) {
    this.socket.io.opts.query.token = token;
  }

  connect() {
    this.socket.connect();
  }

  getSocket() {
    return this.socket;
  }
}

const socketInstance = new Socket();
Object.freeze(socketInstance);

export default socketInstance;
