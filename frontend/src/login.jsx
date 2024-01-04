import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import HttpConn from "./services/http_conn";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      new HttpConn()
        .post("/api/login", { username, password, rememberMe })
        .then((data) => {
          if (data.status === "success") {
            navigate("/chat");
          } else {
            setError(true);
          }
        });
      setError(false);
    } catch (error) {
      setError(true);
    }
  };
  return (
    (document.title = "Chat - Login"),
    (
      <div className="wrapper">
        <div className="form">
          <h1>Chat App</h1>
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(false);
              }}
              className="input"
              placeholder="Username"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="input"
              placeholder="Password"
              required
            />
            <div className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </div>
            <div align="center">
              <button type="submit" className="button">
                <span>Login</span>
              </button>
            </div>

            <p>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </form>
          <h2 className="error">{error ? "Incorrect Credentials" : ""}</h2>
        </div>
      </div>
    )
  );
}
