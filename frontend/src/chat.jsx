import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import socketInstance from "./services/socket_conn";
import HttpConn from "./services/http_conn";

import ChatRoom from "./components/chat_room";
import ChatSidebar from "./components/chat_sidebar";

import { useRoomContext } from "./context/room_context";
import { useFriendContext } from "./context/friend_context";
import { useUserContext } from "./context/user_context";

export default function Chat() {
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
  const [friendRequests, setFriendRequests] = useState([]);

  const navigate = useNavigate();

  const closeChat = () => {
    setActiveRoom("");
    setMessages([]);
    setActiveFriend("");
    setFriendsMessages([]);
  };
  var token = localStorage.getItem("token");

  const httpConn = new HttpConn();
  httpConn.headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
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
        newRooms[index].last_message_user = data.last_message_user;
        return newRooms;
      });
      if (data.room_code === activeRoom.room_code) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    });
    return () => {
      socket.off("recieved_msg");
    };
  }, [activeRoom]);

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
    socket.on("friend_message_deleted", (data) => {
      setFriendsMessages((prevMessages) => {
        return prevMessages.filter((message) => message.id !== data.id);
      });
      setFriends((prevFriends) => {
        const index = prevFriends.findIndex(
          (friend) => friend.id === data.friend_id
        );
        const newFriends = [...prevFriends];
        newFriends[index].last_message = data.last_message;
        newFriends[index].last_message_user = data.last_message_user;
        return newFriends;
      });
    });
    return () => {
      socket.off("friend_message_deleted");
    };
  }, []);

  useEffect(() => {
    if (token !== null) {
      httpConn.get("/api/chat").then((data) => {
        if (data.status === 500) {
          navigate("/login?redirectFrom=chat", {
            state: { from: location.pathname },
          });
        } else if (data.status === 401) {
          navigate("/login", { state: { from: location.pathname } });
        } else if (data.status === 200) {
          setUser(localStorage.getItem("username"));
          data.json().then((data) => {
            setFriendRequests(data.friends_request);
            setRooms(data.rooms);
            setFriends(data.friends);
            socket.connect();
          });
        }
      });
    } else {
      navigate("/login?redirectFrom=chat", {
        state: { from: location.pathname },
      });
    }
  }, []);

  useEffect(() => {
    socket.on("friend_message_received", (data) => {
      setFriendsMessages((prevMessages) => {
        return [...prevMessages, data];
      });
      setFriends((prevFriends) => {
        const index = prevFriends.findIndex(
          (friend) => friend.id === data.friend_id
        );
        const newFriends = [...prevFriends];
        newFriends[index].last_message = data.msg;
        newFriends[index].last_message_user = data.last_message_user;
        return newFriends;
      });
    });
    return () => {
      socket.off("friend_message_received");
    };
  }, [activeFriend]);

  useEffect(() => {
    socket.on("friend_request_accepted", (data) => {
      setFriends((prevFriends) => {
        return [...prevFriends, data];
      });
    });
    return () => {
      socket.off("friend_request_accepted");
    };
  }, []);

  useEffect(() => {
    socket.on("friend_request_received", (data) => {
      setFriendRequests((prevRequests) => {
        return [...prevRequests, data];
      });
    });
    return () => {
      socket.off("friend_request_received");
    };
  }, []);
  return (
    (document.title = "Chat"),
    (
      <>
        <div>
          <ChatSidebar
            friendRequests={friendRequests}
            closeChat_={closeChat}
            setFriendRequests={setFriendRequests}
          />
          {(activeRoom || activeFriend) && <ChatRoom closeChat_={closeChat} />}
          <div className="no-chat-selected">
            <h1>Select a chat to start messaging</h1>
          </div>
        </div>
      </>
    )
  );
}
