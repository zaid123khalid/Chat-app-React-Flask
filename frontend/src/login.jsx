import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import HttpConn from "./services/http_conn";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState({
    username: false,
    password: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      new HttpConn()
        .post("/api/login", { username, password, rememberMe })
        .then((data) => {
          if (data.status === "success") {
            navigate("/chat");
          } else {
            if (
              data.status === "error" &&
              data.message === "Invalid username"
            ) {
              setError({ ...error, username: true });
            } else if (
              data.status === "error" &&
              data.message === "Invalid password"
            ) {
              setError({ ...error, password: true });
            } else {
              setError({ ...error, username: true, password: true });
            }
          }
        });
    } catch (error) {}
  };
  return (
    (document.title = "Chat - Login"),
    (
      <div className="wrapper">
        <div className="form">
          <h1>Login</h1>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-username-input">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(false);
                }}
                className={`login-input` + (error.username ? " error" : "")}
                placeholder="Username"
                required
              />
              <span>
                {error.username ? (
                  <span className="error">Invalid Username</span>
                ) : (
                  ""
                )}
              </span>
            </div>
            <div className="login-password-input">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`login-input` + (error.password ? " error" : "")}
                placeholder="Password"
                required
              />
              <span>
                {error.password ? (
                  <span className="error">Invalid Password</span>
                ) : (
                  ""
                )}
              </span>
            </div>
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
        </div>
      </div>
    )
  );
}
