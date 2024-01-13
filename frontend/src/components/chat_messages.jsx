import deleteImg from "../assets/delete-100.png";
import HttpConn from "../services/http_conn";
import socketInstance from "../services/socket_conn";
import { useRef, useEffect, useState } from "react";

export default function ChatMessages({
  messages,
  username_,
  isRoomChat,
  activeRoom,
  selectedFriend_,
}) {
  const messagesEndRef = useRef(null);

  const formatTime = (fullTimeString, isSocket) => {
    var datetimeOffset = new Date().getTimezoneOffset() / 60;
    var date = new Date(fullTimeString)
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, "");

    var date_ = date.substring(11, 13);

    if (isSocket) {
      return (
        date.substring(0, 11) +
        (Number(date_) + Number(datetimeOffset.toString().replace("-", ""))) +
        date.substring(13, 19)
      );
    }
    return date;
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo(0, messagesEndRef.current?.scrollHeight);
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  return (
    <>
      <div className="chat-messages" ref={messagesEndRef}>
        {isRoomChat &&
          messages.map((message) => (
            <div
              className={`${
                message.username === username_ ? "sender" : "receiver"
              } message`}
              key={message.id}
              id={message.id}
            >
              {message.username === username_ && (
                <a
                  className="delete-msg-btn"
                  onClick={() => {
                    socketInstance.getSocket().emit("delete_message", {
                      room_code: activeRoom.room_code,
                      id: message.id,
                    });
                  }}
                >
                  <img src={deleteImg} alt="" width="20px" height="20px" />
                </a>
              )}
              <span className="username">
                {message.username === username_ ? "You" : message.username}
              </span>
              <br />
              <span className="message-body">{message.msg}</span>
              <br />
              <span className="time">
                {formatTime(message.time, message.isSocket)}
              </span>
            </div>
          ))}

        {!isRoomChat &&
          messages.map((message) => (
            <div
              className={`${
                message.sender === username_ ? "sender" : "receiver"
              } message`}
              key={message.id}
              id={message.id}
            >
              {message.sender === username_ && (
                <a
                  className="delete-msg-btn"
                  onClick={() => {
                    socketInstance.getSocket().emit("delete_friend_message", {
                      id: message.id,
                      friend_id: selectedFriend_.id,
                    });
                  }}
                >
                  <img src={deleteImg} alt="" width="20px" height="20px" />
                </a>
              )}
              <span className="username">
                {message.sender === username_ ? "You" : message.sender}
              </span>
              <br />
              <span className="message-body">{message.msg}</span>
              <br />
              <span className="time">
                {formatTime(message.time, message.isSocket)}
              </span>
            </div>
          ))}
      </div>
    </>
  );
}
