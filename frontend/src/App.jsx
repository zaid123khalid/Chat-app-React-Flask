import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./App.css";
import Home from "./home";
import Login from "./login";
import Signup from "./signup";
import Chat from "./chat";
import Not_Found from "./not_found";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Not_Found />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
