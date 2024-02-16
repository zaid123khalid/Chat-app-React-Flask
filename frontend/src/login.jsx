import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import HttpConn from "./services/http_conn";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [tokenError, setTokenError] = useState(false);
  const [error, setError] = useState(false);
  const [errormsg, setErrormsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    new HttpConn().post("/api/login", { ...formData }).then((data) => {
      if (data.status === "success") {
        localStorage.setItem("username", data.username);
        localStorage.setItem("token", data.token);
        navigate("/chat", { replace: true });
      } else {
        if (data.status === "error" && data.message === "Invalid username") {
          setError(true);
          setErrormsg(data.message);
        } else if (
          data.status === "error" &&
          data.message === "Invalid password"
        ) {
          setError(true);
          setErrormsg(data.message);
        } else {
          setError(true);
          setErrormsg(data.message);
        }
      }
    });
  };

  useEffect(() => {
    if (searchParams.get("redirectFrom") === "chat") {
      setTokenError(true);
    }
  }, [searchParams]);

  return (
    (document.title = "Chat - Login"),
    (
      <div className="wrapper">
        <div className="form">
          <h1>Login</h1>
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="text"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                setError(false);
              }}
              className={`login-input` + (error.username ? " error" : "")}
              placeholder="Username"
              required
            />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setError(false);
              }}
              className={`login-input` + (error.password ? " error" : "")}
              placeholder="Password"
              required
            />
            <div className="remember-me">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => {
                  setFormData({ ...formData, rememberMe: e.target.checked });
                }}
              />
              <span>Remember me</span>
            </div>
            <span className="error">{error ? errormsg : ""}</span>
            <button type="submit" className="button">
              <span>Login</span>
            </button>
            <p>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>

            {tokenError && (
              <p className="error">
                Your token has expired. Please login again
              </p>
            )}
          </form>
        </div>
      </div>
    )
  );
}
