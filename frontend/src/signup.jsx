import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import HttpConn from "./services/http_conn";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (password !== confirmPassword) {
        setError(true);
        return;
      }
      new HttpConn()
        .post(
          "/api/signup",

          { username, password, email }
        )
        .then((data) => {
          if (data.status === "success") {
            navigate("/login");
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
    (document.title = "Chat - Signup"),
    (
      <div className="wrapper">
        <div className="form">
          <h2>Signup</h2>
          <form onSubmit={handleSubmit} className="signup-form">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="Username"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Password"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
              placeholder="Password"
              required
            />

            <div align="center">
              <button type="submit" className="button">
                <span>Signup</span>
              </button>
            </div>
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
            <h2 className="error">{error ? "Incorrect Credentials" : ""}</h2>
          </form>
        </div>
      </div>
    )
  );
}
