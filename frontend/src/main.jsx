import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { RoomProvider } from "./context/room_context";
import { FriendProvider } from "./context/friend_context";
import { UserProvider } from "./context/user_context";

import "./app.css";
import Home from "./home";
import Login from "./login";
import Signup from "./signup";
import Chat from "./chat";
import Not_Found from "./not_found";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserProvider>
      <RoomProvider>
        <FriendProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />}></Route>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="*" element={<Not_Found />} />
            </Routes>
          </BrowserRouter>
        </FriendProvider>
      </RoomProvider>
    </UserProvider>
  </React.StrictMode>
);
