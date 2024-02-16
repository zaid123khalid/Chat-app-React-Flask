import React from "react";

import deleteImg from "../assets/delete-100.png";
import addFriendImg from "../assets/add-friend-80.png";

import socketInstance from "../services/socket_conn";
import HttpCon from "../services/http_conn";

import { useUserContext } from "../context/user_context";
import { useRoomContext } from "../context/room_context";
import { useFriendContext } from "../context/friend_context";

import { Tooltip } from "@mui/material";
export default function ChatMessage({ message }) {
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

  const httpConn = new HttpCon();
  httpConn.headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  };

  const getFriend = (sender) => {
    return friends.find(
      (friend) => friend.user1 === sender || friend.user2 === sender
    );
  };
  return (
    <div
      className={`${message.sender === user ? "sender" : "receiver"} message`}
      key={message.id}
      id={message.id}
    >
      {message.sender === user && (
        <Tooltip title="Delete message" arrow placement="top-start">
          <a
            className="delete-msg-btn"
            onClick={() => {
              {
                activeFriend &&
                  socketInstance.getSocket().emit("delete_friend_message", {
                    friend_id: activeFriend.id,
                    id: message.id,
                  });
              }
              {
                activeRoom &&
                  socketInstance.getSocket().emit("delete_message", {
                    room_code: activeRoom.room_code,
                    id: message.id,
                  });
              }
            }}
          >
            <img src={deleteImg} alt="" width="20px" height="20px" />
          </a>
        </Tooltip>
      )}

      {message.sender !== user && !getFriend(message.sender) && (
        <Tooltip title="Send friend request" arrow>
          <a
            className="send-friend-request-btn"
            onClick={() => {
              httpConn
                .post("/api/send_friend_request", {
                  receiver: message.sender,
                })
                .then((res) => {
                  if (res.status === "success") {
                    socketInstance.getSocket().emit("friend_request_sent", {
                      user1: res.friend_request.sender,
                      user2: res.friend_request.receiver,
                    });
                  }
                });
            }}
          >
            <img src={addFriendImg} alt="" width="20px" height="20px" />
          </a>
        </Tooltip>
      )}
      <span className="user">
        {message.sender === user ? "You" : message.sender}
      </span>
      <br />
      <span className="message-body">{message.msg}</span>
      <br />
      <span className="time">{message.time}</span>
    </div>
  );
}
