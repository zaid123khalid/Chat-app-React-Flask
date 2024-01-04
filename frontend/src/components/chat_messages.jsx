import deleteImg from "../assets/delete-100.png";

import { useState } from "react";

export default function ChatMessages({
  messages,
  username_,
  messagesEndRef_,
  deleteMessage_,
}) {
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
  return (
    <>
      <div className="chat-messages" ref={messagesEndRef_}>
        {messages.map((message) => (
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
                onClick={deleteMessage_(message.id)}
              >
                <img src={deleteImg} alt="" width="20px" height="20px" />
              </a>
            )}

            <span className="username">{message.username}</span>
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
