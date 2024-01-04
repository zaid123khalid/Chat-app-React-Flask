import { useState, useEffect, useRef } from "react";
import { useNavigate, redirect } from "react-router-dom";
import { io } from "socket.io-client";

import HttpConn from "./services/http_conn";
import ChatRoom from "./components/chat_room";
import CharSidebar from "./components/chat_sidebar";

export default function Chat() {
  const messagesEndRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [activeRoom, setActiveRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const navigate = useNavigate();

  const closeChat = () => {
    setActiveRoom("");
    setSelectedRoom("");
    setMessages([]);
    setNewMsg("");
  };

  const httpConn = new HttpConn();

  const socket = io("http://localhost:5000", {
    transports: ["websocket"],
  });
  socket.connect();
  useEffect(() => {
    socket.on("recieved_msg", (data) => {
      data["isSocket"] = true;
      if (data.room_code === selectedRoom) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    });
    return () => {
      socket.off("recieved_msg");
    };
  }, [selectedRoom]);

  useEffect(() => {
    socket.on("latest_message", (data) => {
      setRooms((prevRooms) => {
        const index = prevRooms.findIndex(
          (room) => room.room_code === data.room_code
        );
        const newRooms = [...prevRooms];
        newRooms[index].room_name = data.room_name;
        newRooms[index].last_message = data.last_message;
        newRooms[index].last_message_user = data.last_messsage_user;
        return newRooms;
      });
    });
    return () => {
      socket.off("latest_message");
    };
  }, []);
  useEffect(() => {
    socket.on("message_deleted", (data) => {
      setMessages((prevMessages) => {
        return prevMessages.filter((message) => message.id !== data.id);
      });
      setRooms((prevRooms) => {
        const index = prevRooms.findIndex(
          (room) => room.room_code === data.room_code
        );
        const newRooms = [...prevRooms];
        newRooms[index].room_name = data.room_name;
        newRooms[index].last_message = data.last_message;
        newRooms[index].last_message_user = data.last_message_user;
        return newRooms;
      });
    });
    return () => {
      socket.off("message_deleted");
    };
  }, []);

  useEffect(() => {
    httpConn.post("/api/chat").then((data) => {
      if (data.status === "success") {
        setRooms(data.rooms);
      } else {
        if (data.status === "User not authenticated") {
          navigate("/login", { state: { from: location.pathname } });
        }
      }
    });
  }, []);

  const onRoomJoined = (roomCode) => {
    httpConn.post("/api/join_room", { room_code: roomCode }).then((data) => {
      if (data.status === "success") {
        setRooms((prevRooms) => {
          if (
            prevRooms.findIndex(
              (room) => room.room_code === data.room[0].room_code
            ) === -1
          ) {
            return [...prevRooms, data.room[0]];
          } else {
            return prevRooms;
          }
        });
        setActiveRoom(data.room);
        setSelectedRoom(data.room[0].room_code);
        setMessages(data.messages);
        setActiveRoom(data.room);
        setUsername(data.username);
      } else {
      }
    });
  };
  const onRoomCreated = (roomName) => {
    httpConn
      .post("/api/create_room", { room_name: roomName, username: username })
      .then((data) => {
        if (data.status === "success") {
          onRoomJoined(data.room_code);
        } else {
        }
      });
  };

  const leaveRoom = () => {
    socket.emit("leave", {
      room_code: activeRoom[0].room_code,
      username: username,
    });
    setRooms((prevRooms) => {
      const index = prevRooms.findIndex(
        (room) => room.room_code === activeRoom[0].room_code
      );
      const newRooms = [...prevRooms];
      newRooms.splice(index, 1);
      return newRooms;
    });
    closeChat();
    return () => {
      socket.off("leave_room");
    };
  };

  const sendMessage = () => {
    if (newMsg.trim() === "") {
      return;
    }
    socket.emit("message", {
      room_code: activeRoom[0].room_code,
      username: username,
      msg: newMsg,
    });
    setNewMsg("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo(0, messagesEndRef.current?.scrollHeight);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const deleteMessage = (id) => () => {
    httpConn.delete(`/api/delete_message/${id}`).then((data) => {
      if (data.status === "success") {
        socket.emit("delete_message", {
          room_code: activeRoom[0].room_code,
          id: id,
        });
        setRooms((prevRooms) => {
          const index = prevRooms.findIndex(
            (room) => room.room_code === activeRoom[0].room_code
          );
          const newRooms = [...prevRooms];
          newRooms[index].room_name = data.room_name;
          newRooms[index].last_message = data.last_message;
          newRooms[index].last_message_user = data.last_message_user;
          return newRooms;
        });
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const index = newMessages.findIndex((msg) => msg.id === id);
          newMessages.splice(index, 1);
          return newMessages;
        });
      }
    });
  };
  return (
    (document.title = "Chat"),
    (
      <div>
        <CharSidebar
          rooms_={rooms}
          selectedRoom_={selectedRoom}
          onRoomCreated_={onRoomCreated}
          onRoomJoined_={onRoomJoined}
        ></CharSidebar>
        {activeRoom.length > 0 && (
          <ChatRoom
            leaveRoom_={leaveRoom}
            activeRoom_={activeRoom}
            messages_={messages}
            username_={username}
            newMsg_={newMsg}
            setNewMsg_={setNewMsg}
            sendMessage_={sendMessage}
            messagesEndRef_={messagesEndRef}
            closeChat_={closeChat}
            deleteMessage_={deleteMessage}
          />
        )}
      </div>
    )
  );
}
