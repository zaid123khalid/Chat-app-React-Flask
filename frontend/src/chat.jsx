import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import socketInstance from "./services/socket_conn";
import HttpConn from "./services/http_conn";
import ChatRoom from "./components/chat_room";
import FriendRoom from "./components/friend_room";
import ChatSidebar from "./components/chat_sidebar";

export default function Chat() {
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [activeFriend, setActiveFriend] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [activeRoom, setActiveRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [friendsMessages, setFriendsMessages] = useState([]);
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const closeChat = () => {
    setActiveRoom("");
    setSelectedRoom("");
    setMessages([]);
  };

  const httpConn = new HttpConn();
  const socket = socketInstance.getSocket();
  useEffect(() => {
    socket.on("recieved_msg", (data) => {
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
    socket.on("room_deleted", (data) => {
      closeChat();
      setRooms((prevRooms) => {
        return prevRooms.filter((room) => room.room_code !== data.room_code);
      });
    });
    return () => {
      socket.off("room_deleted");
    };
  }, [activeRoom]);
  useEffect(() => {
    socket.on("message_deleted", (data) => {
      console.log(data);
      setMessages((prevMessages) => {
        console.log(prevMessages);

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
    socket.on("friend_message_deleted", (data) => {
      setFriendsMessages((prevMessages) => {
        return prevMessages.filter((message) => message.id !== data.id);
      });
    });
    return () => {
      socket.off("friend_message_deleted");
    };
  }, []);
  useEffect(() => {
    httpConn.post("/api/chat").then((data) => {
      if (data.status === "success") {
        setRooms(data.rooms);
        setFriends(data.friends);
        setUsername(data.username);
      } else {
        if (data.status === "User not authenticated") {
          navigate("/login", { state: { from: location.pathname } });
        }
      }
    });
  }, []);

  const onRoomJoined = (roomCode) => {
    setActiveFriend("");
    setSelectedFriend("");

    if (roomCode === "" || roomCode === null) {
      closeChat();
      return;
    } else {
      httpConn.post("/api/join_room", { room_code: roomCode }).then((data) => {
        if (data.status === "success") {
          setRooms((prevRooms) => {
            if (
              prevRooms.findIndex(
                (room) => room.room_code === data.room.room_code
              ) === -1
            ) {
              return [...prevRooms, data.room];
            } else {
              return prevRooms;
            }
          });
          setSelectedRoom(data.room.room_code);
          setMessages(data.room.messages);
          setActiveRoom(data.room);
        } else {
        }
      });
    }
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
      room_code: activeRoom.room_code,
      username: username,
    });
    setRooms((prevRooms) => {
      const index = prevRooms.findIndex(
        (room) => room.room_code === activeRoom.room_code
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

  const deleteRoom = (room_code) => () => {
    socket.emit("delete_room", { room_code: room_code });
  };

  const onFriendSelected = (friend) => {
    closeChat();
    if (friend === "" || friend === null) {
      setActiveFriend("");
      setSelectedFriend("");
      return;
    } else {
      httpConn
        .post("/api/join_friend", {
          friend_username:
            friend.user1 === username ? friend.user2 : friend.user1,
        })
        .then((data) => {
          if (data.status === "success") {
            setSelectedFriend(data.friend);
            setActiveFriend(data.friend);
            setFriendsMessages(data.friend.messages);
          } else {
          }
        });
    }
  };
  useEffect(() => {
    socket.on("friend_message_received", (data) => {
      data["isSocket"] = true;
      setFriendsMessages((prevMessages) => {
        return [...prevMessages, data];
      });
    });
    return () => {
      socket.off("friend_message_received");
    };
  }, [activeFriend]);
  return (
    (document.title = "Chat"),
    (
      <div>
        <ChatSidebar
          rooms_={rooms}
          friends_={friends}
          selectedFriend_={selectedFriend}
          onFriendSelected_={onFriendSelected}
          selectedRoom_={selectedRoom}
          onRoomCreated_={onRoomCreated}
          onRoomJoined_={onRoomJoined}
          username={username}
        ></ChatSidebar>
        {activeRoom && (
          <ChatRoom
            deleteRoom_={deleteRoom}
            leaveRoom_={leaveRoom}
            activeRoom_={activeRoom}
            messages_={messages}
            username_={username}
            closeChat_={closeChat}
          />
        )}
        {activeFriend && (
          <FriendRoom
            selectedFriend_={selectedFriend}
            username_={username}
            messages={friendsMessages}
            activeFriend={activeFriend}
          />
        )}
      </div>
    )
  );
}
