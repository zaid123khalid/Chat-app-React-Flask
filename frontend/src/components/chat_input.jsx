import socketInstance from "../services/socket_conn";
import send from "../assets/send-50.png";
import { useState } from "react";
export default function ChatInput({ activeRoom_, username, selectedFriend_ }) {
  const socket = socketInstance.getSocket();

  const [newMsg, setNewMsg] = useState("");
  const sendMessage = () => {
    if (newMsg.trim() === "") {
      return;
    }

    if (selectedFriend_) {
      console.log(selectedFriend_);
      socket.emit("friend_message", {
        user1: username,
        user2:
          selectedFriend_.user1 === username
            ? selectedFriend_.user2
            : selectedFriend_.user1,
        msg: newMsg,
      });
      setNewMsg("");
      return;
    }

    socket.emit("message", {
      room_code: activeRoom_.room_code,
      username: username,
      msg: newMsg,
    });
    setNewMsg("");
  };

  return (
    <div
      className="chat-input"
      onKeyUp={(e) => {
        if (e.key === "Enter") {
          sendMessage();
        }
      }}
    >
      <input
        type="text"
        placeholder="Enter Message"
        value={newMsg}
        onChange={(e) => setNewMsg(e.target.value)}
      />
      <button type="submit" className="send-btn" onClick={sendMessage}>
        <img
          src={send}
          width="25"
          height="25"
          alt=""
          srcSet=""
          style={{ rotate: "10deg" }}
        />
      </button>
    </div>
  );
}
