import ChatMessages from "./chat_messages";
import ChatInput from "./chat_input";

import { useEffect, useState } from "react";
import socketInstance from "../services/socket_conn";

export default function ChatRoom({
  leaveRoom_,
  activeRoom_,
  messages_,
  username_,
  closeChat_,
}) {
  const [context, setContext] = useState(false);
  const [xyPos, setxyPos] = useState({ x: 0, y: 0 });

  const socket = socketInstance.getSocket();

  function deleteRoom() {
    socket.emit("delete_room", {
      room_code: activeRoom_.room_code,
    });
  }
  const showContextMenu = (e) => {
    setContext(false);

    setxyPos({ x: e.pageX, y: e.pageY });

    if (e.target.tagName === "HEADER") {
      e.preventDefault();
      setContext(true);
    } else {
      setContext(false);
    }
  };
  const shareCode_ = () => {
    const code = activeRoom_.room_code;
    document.execCommand("copy");
    document.addEventListener("copy", (e) => {
      e.clipboardData.setData("text/plain", code);
      e.preventDefault();
    });
    alert("Room code copied to clipboard");
  };

  return (
    document.addEventListener("click", () => {
      setContext(false);
    }),
    (
      <div className="chat-content">
        <header onContextMenu={(e) => showContextMenu(e)}>
          <h1>{activeRoom_.room_name}</h1>
          {context && (
            <div
              className="room-settings context-menu"
              style={{ top: xyPos.y, left: xyPos.x - 100 }}
              onClick={() => {
                setContext(false);
              }}
            >
              {activeRoom_.admin === username_ && (
                <a onClick={deleteRoom}>Delete Room</a>
              )}
              <a onClick={shareCode_}>Share Room Code</a>
              <a onClick={closeChat_}>Close Chat</a>
              <a onClick={leaveRoom_}>Leave Room</a>
            </div>
          )}
        </header>

        <ChatMessages
          messages={messages_}
          username_={username_}
          isRoomChat={true}
          activeRoom={activeRoom_}
        />
        <ChatInput activeRoom_={activeRoom_} username={username_} />
      </div>
    )
  );
}
