import socketInstance from "../services/socket_conn";
import send from "../assets/send-50.png";
import { useState, useEffect } from "react";
import { Tooltip } from "@mui/material";
import { useRoomContext } from "../context/room_context";
import { useFriendContext } from "../context/friend_context";
import { useUserContext } from "../context/user_context";
import Picker from "emoji-picker-react";

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

  useEffect(() => {
    document.addEventListener("click", (e) => {
      if (
        e.target.className === "emoji-btn" ||
        e.target.className === "emoji-picker" ||
        e.target.classList[0] === "epr-btn" ||
        e.target.classList[0] === "epr-emoji-img" ||
        e.target.classList[0] === "epr-emojis" ||
        e.target.classList[0] === "epr_-orqfm8" ||
        e.target.classList[0] === "epr-icn-search" ||
        e.target.classList[0] === "epr-icn-clear-search" ||
        e.target.classList[0] === "epr_q53mwh" ||
        e.target.classList[0] === "epr-emoji-category-label" ||
        e.target.classList[0] === "epr-emoji-category-content" ||
        e.target.classList[0] === "epr-emoji-category" ||
        e.target.classList[0] === "epr-category-nav" ||
        e.target.classList[0] === "epr-skin-tones"
      ) {
        return;
      }
      var emojiPicker = document.querySelector(".emoji-picker");
      if (emojiPicker) {
        emojiPicker.style.display = "none";
      }
    });
  }, []);

  return (
    <>
      <div className="emoji-picker">
        <Picker
          theme="dark"
          style={{
            position: "absolute",
            bottom: "25px",
            right: "5px",
          }}
          onEmojiClick={(emoji, event) => {
            setNewMsg(newMsg + emoji.emoji);
          }}
        />
      </div>
      <div className="chat-input">
        <Tooltip title="Emoji" placement="top">
          <button
            className="emoji-btn"
            onClick={() => {
              document.querySelector(".emoji-picker").style.display = "block";
            }}
          >
            😀
          </button>
        </Tooltip>

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
    </>
  );
}
