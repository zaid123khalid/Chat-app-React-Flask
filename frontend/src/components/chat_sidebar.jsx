import join from "../assets/join-48.png";
import create from "../assets/create-48.png";
import notificationImg from "../assets/notification-32.png";

import Tooltip from "@mui/material/Tooltip";

import { useNavigate } from "react-router-dom";
import HttpConn from "../services/http_conn";
import { useState, useEffect } from "react";
import { useRoomContext } from "../context/room_context";
import { useFriendContext } from "../context/friend_context";
import { useUserContext } from "../context/user_context";
import socketInstance from "../services/socket_conn";

export default function ChatSidebar({
  friendRequests,
  closeChat_,
  setFriendRequests,
}) {
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
  const [dialogBox, setDialogBox] = useState(false);
  const [isRoomDialog, setIsRoomDialog] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [notification, setNotification] = useState(false);
  const navigate = useNavigate();

  const httpConn = new HttpConn();
  httpConn.headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  };

  const logout = () => {
    closeChat_();
    httpConn.post("/api/logout").then((data) => {
      if (data.status === "success") {
        localStorage.removeItem("token");
        navigate("/login");
      }
    });
  };
  const onRoomCreated = (roomName) => {
    httpConn
      .post("/api/create_room", {
        room_name: roomName,
      })
      .then((data) => {
        if (data.status === "success") {
          onRoomJoined(data.room_code);
        } else {
        }
      });
  };

  const onRoomJoined = (roomCode) => {
    setActiveFriend("");
    setFriendsMessages([]);
    if (roomCode === "" || roomCode === null) {
      return;
    } else {
      httpConn
        .post("/api/join_room", {
          room_code: roomCode,
        })
        .then((data) => {
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
            setMessages(data.room.messages);
            setActiveRoom(data.room);
          } else {
          }
        });
    }
  };

  const onFriendSelected = (friend) => {
    setActiveRoom("");
    setMessages([]);
    if (friend === "" || friend === null) {
      return;
    } else {
      httpConn
        .post("/api/join_friend", {
          friend_id: friend.id,
        })
        .then((data) => {
          if (data.status === "success") {
            setActiveFriend(data.friend);
            setFriendsMessages(data.friend.messages);
          } else {
          }
        });
    }
  };

  return (
    <>
      <div
        className="dialog-container"
        style={{
          display: dialogBox ? "flex" : "none",
        }}
      >
        {isRoomDialog ? (
          <div className="dialog-box">
            <h1>Enter Room Name</h1>
            <input
              type="text"
              placeholder="Enter Room Name"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
              }}
            />
            <button
              onClick={() => {
                onRoomCreated(roomName);
                setRoomName("");
                setDialogBox(false);
              }}
            >
              Create Room
            </button>
            <button onClick={() => setDialogBox(false)}>Close</button>
          </div>
        ) : (
          <div className="dialog-box">
            <h1>Enter Room Code</h1>
            <input
              type="text"
              placeholder="Enter Room Code"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value);
              }}
            />
            <button
              onClick={() => {
                onRoomJoined(roomCode);
                setRoomCode("");
                setDialogBox(false);
              }}
            >
              Join Room
            </button>
            <button onClick={() => setDialogBox(false)}>Close</button>
          </div>
        )}
      </div>

      <div
        className="notification-container"
        style={{ display: notification ? "flex" : "none" }}
      >
        <div className="notification-box">
          <h1>Notifications</h1>
          <ul>
            {friendRequests &&
              friendRequests.map((request) => (
                <li key={request.id}>
                  <span>
                    <b>{request.sender}</b> sent you a friend request
                  </span>

                  <button
                    onClick={() => {
                      httpConn
                        .post("/api/accept_friend_request", {
                          friend_request_id: request.id,
                        })
                        .then((data) => {
                          if (data.status === "success") {
                            socketInstance
                              .getSocket()
                              .emit("friend_request_accepted", {
                                friend_id: data.friend.id,
                              });
                          }
                        });
                      setFriendRequests((prevRequests) => {
                        return prevRequests.filter(
                          (req) => req.id !== request.id
                        );
                      });
                    }}
                  >
                    Accept
                  </button>
                  <button>Reject</button>
                </li>
              ))}
            {friendRequests.length === 0 && <li>No new notifications</li>}
          </ul>
          <button className="close-btn" onClick={() => setNotification(false)}>
            Close
          </button>
        </div>
      </div>

      <div className="sidebar">
        <header className="sidebar-header">
          <h1>Chats</h1>
          <div className="sidebar-buttons">
            <Tooltip title="Notifications">
              <button
                className="menu-button"
                onClick={() => {
                  setNotification(!notification);
                }}
              >
                <img
                  src={notificationImg}
                  alt="Notifications"
                  width={25}
                  height={25}
                />
              </button>
            </Tooltip>
            <Tooltip title="Create Room">
              <button
                className="menu-button"
                onClick={() => {
                  setIsRoomDialog(true);
                  setDialogBox(true);
                }}
              >
                <img src={create} alt="create room" width={25} height={25} />
              </button>
            </Tooltip>
            <Tooltip title="Join Room">
              <button
                className="menu-button"
                onClick={() => {
                  setIsRoomDialog(false);
                  setDialogBox(true);
                }}
              >
                <img src={join} alt="Join room" width={25} height={25} />
              </button>
            </Tooltip>
            <div className="divider"></div>
          </div>
        </header>
        <ul>
          {rooms.map((room) => (
            <li
              key={room.room_code}
              id={room.room_code}
              className={`sidebar-item ${
                activeRoom.room_code === room.room_code ? "active" : ""
              }`}
              onClick={() => {
                onFriendSelected("");
                onRoomJoined(room.room_code);
              }}
            >
              {room.room_name}
              <br />
              {room.last_message ? (
                <span className="last-message">
                  {room.last_message_user === user
                    ? "You"
                    : room.last_message_user}
                  : {room.last_message}
                </span>
              ) : (
                <span className="last-message">No messages</span>
              )}
            </li>
          ))}
          {friends.map((friend) => (
            <li
              onClick={() => {
                onRoomJoined("");
                onFriendSelected(friend);
              }}
              key={friend.id}
              id={friend.id}
              className={`sidebar-item ${
                friend.id === activeFriend.id ? "active" : ""
              }`}
            >
              {friend.user1 === user ? friend.user2 : friend.user1}
              <br />
              {friend.last_message ? (
                <span className="last-message">
                  {friend.last_message_user === user
                    ? "You"
                    : friend.last_message_user}
                  : {friend.last_message}
                </span>
              ) : (
                <span className="last-message">No messages</span>
              )}
            </li>
          ))}
        </ul>
        <a onClick={logout} className="logout-btn">
          Logout
        </a>
      </div>
    </>
  );
}
