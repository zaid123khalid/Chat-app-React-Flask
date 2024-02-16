import ChatInput from "./chat_input";
import ChatMessage from "./chat_message";

import { useEffect, useState } from "react";
import socketInstance from "../services/socket_conn";
import { useRoomContext } from "../context/room_context";
import { useUserContext } from "../context/user_context";
import { useFriendContext } from "../context/friend_context";
import { useRef } from "react";

export default function ChatRoom({ closeChat_ }) {
  const messagesEndRef = useRef(null);
  const { rooms, setRooms, activeRoom, setActiveRoom, messages, setMessages } =
    useRoomContext();
  const {
    friends,
    setFriends,
    activeFriend,
    setActiveFriend,
    friendsMessages,
    setFriendsMessages,
  } = useFriendContext();

  const { user, setUser } = useUserContext();
  const [context, setContext] = useState(false);
  const [xyPos, setxyPos] = useState({ x: 0, y: 0 });

  const socket = socketInstance.getSocket();

  const deleteRoom = () => {
    socket.emit("delete_room", {
      room_code: activeRoom.room_code,
    });
  };

  const leaveRoom = () => {
    socket.emit("leave", {
      room_code: activeRoom.room_code,
      username: user,
    });
    setRooms((prevRooms) => {
      const index = prevRooms.findIndex(
        (room) => room.room_code === activeRoom.room_code
      );
      const newRooms = [...prevRooms];
      newRooms.splice(index, 1);
      return newRooms;
    });
    closeChat_();
    return () => {
      socket.off("leave_room");
    };
  };

  const showContextMenu = (e) => {
    setContext(false);

    setxyPos({ x: e.pageX, y: e.pageY });

    if (e.target.tagName === "HEADER" || e.target.tagName === "H1") {
      e.preventDefault();
      setContext(true);
    } else {
      setContext(false);
    }
  };

  const shareCode = () => {
    const code = activeRoom.room_code;
    document.execCommand("copy");
    document.addEventListener("copy", (e) => {
      e.clipboardData.setData("text/plain", code);
      e.preventDefault();
    });
    alert("Room code copied to clipboard");
  };

  useEffect(() => {
    document.addEventListener("click", () => {
      setContext(false);
    });
    document.addEventListener("contextmenu", (e) => {
      showContextMenu(e);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollTo(0, messagesEndRef.current.scrollHeight);
  }, [messages, friendsMessages]);

  return (
    <div className="chat-content">
      {activeRoom && (
        <header onContextMenu={(e) => showContextMenu(e)}>
          <h1>{activeRoom.room_name}</h1>
          {context && (
            <div
              className="room-settings context-menu"
              style={{ top: xyPos.y, left: xyPos.x - 100 }}
              onClick={() => {
                setContext(false);
              }}
            >
              {activeRoom.admin === user && (
                <a onClick={deleteRoom}>Delete Room</a>
              )}
              <a onClick={shareCode}>Share Room Code</a>
              <a onClick={closeChat_}>Close Chat</a>
              <a onClick={leaveRoom} className="danger">
                Leave Room
              </a>
            </div>
          )}
        </header>
      )}

      {activeFriend && (
        <header onContextMenu={(e) => showContextMenu(e)}>
          <h1>
            {activeFriend.user1 === user
              ? activeFriend.user2
              : activeFriend.user1}
          </h1>
          {context && (
            <div
              className="room-settings context-menu"
              style={{ top: xyPos.y, left: xyPos.x - 100 }}
              onClick={() => {
                setContext(false);
              }}
            >
              <a onClick={closeChat_}>Close Chat</a>
            </div>
          )}
        </header>
      )}

      <div className="chat-messages" ref={messagesEndRef}>
        {messages &&
          activeRoom &&
          messages.map((message) => <ChatMessage message={message} />)}
        {friendsMessages &&
          activeFriend &&
          friendsMessages.map((message) => <ChatMessage message={message} />)}
      </div>

      <ChatInput />
    </div>
  );
}
