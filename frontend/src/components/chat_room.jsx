import ChatMessages from "./chat_messages";
import ChatInput from "./chat-input";

import { useState, useEffect } from "react";

export default function ChatRoom({
  leaveRoom_,
  messagesEndRef_,
  activeRoom_,
  messages_,
  username_,
  newMsg_,
  setNewMsg_,
  sendMessage_,
  closeChat_,
  deleteMessage_,
}) {
  const [context, setContext] = useState(false);
  const [xyPos, setxyPos] = useState({ x: 0, y: 0 });
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
    const code = activeRoom_[0].room_code;
    navigator.clipboard.writeText(code);
    alert("Room code copied to clipboard");
  };

  return (
    document.addEventListener("click", () => {
      setContext(false);
    }),
    document.addEventListener("contextmenu", (e) => {
      showContextMenu(e);
    }),
    (
      <div className="chat-content">
        <header onContextMenu={(e) => showContextMenu(e)}>
          <h1>{activeRoom_[0].room_name}</h1>
          {context && (
            <div
              className="room-settings context-menu"
              style={{ top: xyPos.y, left: xyPos.x - 100 }}
              onClick={() => {
                setContext(false);
              }}
            >
              <a onClick={shareCode_}>Share Room Code</a>
              <a onClick={closeChat_}>Close Chat</a>
              <a onClick={leaveRoom_}>Leave Room</a>
            </div>
          )}
        </header>

        <ChatMessages
          messages={messages_}
          username_={username_}
          messagesEndRef_={messagesEndRef_}
          deleteMessage_={deleteMessage_}
        />
        <ChatInput
          newMsg_={newMsg_}
          setNewMsg_={setNewMsg_}
          sendMessage_={sendMessage_}
        />
      </div>
    )
  );
}
