import join from "../assets/join-48.png";
import create from "../assets/create-48.png";

import { useNavigate } from "react-router-dom";
import HttpConn from "../services/http_conn";

export default function ChatSidebar({
  rooms_,
  selectedRoom_,
  onRoomCreated_,
  onRoomJoined_,
}) {
  const navigate = useNavigate();
  const logout = () => {
    new HttpConn().post("/api/logout").then((data) => {
      if (data.status === "success") {
        navigate("/login");
      } else {
        setError(true);
      }
    });
  };
  return (
    <div className="sidebar">
      <header className="sidebar-header">
        <h1>Chats</h1>
        <ul className="sidebar-buttons">
          <button
            onClick={() => {
              const enteredName = prompt("Enter Room Name", "");
              onRoomCreated_(enteredName);
            }}
          >
            <img
              src={create}
              alt="create room"
              width={25}
              height={25}
              className="create-btn"
              srcSet=""
            />
          </button>
          <button
            onClick={() => {
              const enteredCode = prompt("Enter Room Code", "");
              onRoomJoined_(enteredCode);
            }}
          >
            <img src={join} alt="" width={25} height={25} srcSet="" />
          </button>
        </ul>
      </header>
      <ul>
        {rooms_.map((room) => (
          <li
            key={room.room_code}
            id={room.room_code}
            className={`sidebar-item ${
              selectedRoom_ === room.room_code ? "active" : ""
            }`}
            onClick={() => onRoomJoined_(room.room_code)}
          >
            {room.room_name}
            <br />
            {room.last_message ? (
              <span className="last-message">
                {room.last_message_user}: {room.last_message}
              </span>
            ) : (
              <span className="last-message">No messages</span>
            )}
          </li>
        ))}
      </ul>
      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </div>
  );
}
