import { Link } from "react-router-dom";
import { useEffect } from "react";
import HttpConn from "./services/http_conn";

export default function Home() {
  var token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const http = new HttpConn();
      http.headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      http.get("/api/verify").then((response) => {
        if (response.status === 200) {
          window.location.href = "/chat";
        }
      });
    }
  }, [token]);
  return (
    <header>
      <h1>Chat App</h1>
      <nav>
        <ul>
          <li>
            <Link to="/chat">Chat</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/signup">Signup</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
