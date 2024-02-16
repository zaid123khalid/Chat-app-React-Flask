import socketInstance from "../services/socket_conn";
import send from "../assets/send-50.png";
import { useState } from "react";
import { Tooltip } from "@mui/material";
import { useRoomContext } from "../context/room_context";
import { useFriendContext } from "../context/friend_context";
import { useUserContext } from "../context/user_context";

export default function ChatInput() {
  const { user, setUser } = useUserContext();
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
  const socket = socketInstance.getSocket();

  const [newMsg, setNewMsg] = useState("");
  const sendMessage = () => {
    if (newMsg.trim() === "") {
      return;
    }

    if (activeFriend) {
      socket.emit("friend_message", {
        friend_id: activeFriend.id,
        user1: user,
        user2:
          activeFriend.user1 === user ? activeFriend.user2 : activeFriend.user1,
        msg: newMsg,
      });
      setNewMsg("");
      return;
    }

    socket.emit("message", {
      room_code: activeRoom.room_code,
      username: user,
      msg: newMsg,
    });
    setNewMsg("");
  };

  return (
    <div className="chat-input">
      <input
        type="text"
        placeholder="Enter Message"
        value={newMsg}
        autoFocus={true}
        onChange={(e) => setNewMsg(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            sendMessage();
          }
        }}
      />

      <Tooltip title="Send Message" placement="top">
        <button type="submit" className="send-btn" onClick={sendMessage}>
          <img
            src={send}
            width="25"
            height="25"
            alt="Send"
            srcSet=""
            style={{ rotate: "10deg" }}
          />
        </button>
      </Tooltip>
    </div>
  );
}
