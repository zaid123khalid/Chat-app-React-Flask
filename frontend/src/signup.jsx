import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import HttpConn from "./services/http_conn";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });

  const [error, setError] = useState(false);
  const [errormsg, setErrormsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrormsg("Passwords do not match");
      setError(true);
      return;
    }

    if (formData.password.length < 8) {
      setErrormsg("Password must be atleast 8 characters long");
      setError(true);
      return;
    }

    new HttpConn().post("/api/signup", { ...formData }).then((data) => {
      if (data.status === "success") {
        navigate("/login");
      } else {
        if (
          data.status === "error" &&
          data.message === "Username already exists"
        ) {
          setErrormsg("Username already exists");
        } else if (
          data.status === "error" &&
          data.message === "Email already exists"
        ) {
          setErrormsg("Email already exists");
        }

        setError(true);
        setTimeout(() => {
          setError(false);
        }, 1000);
      }
    });
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
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="input"
              placeholder="Username"
              required
            />
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="input"
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="input"
              placeholder="Password"
              required
            />
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="input"
              placeholder="Password"
              required
            />

            <button type="submit" className="button">
              <span>Signup</span>
            </button>
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
            <h2 className="error">{error ? errormsg : ""}</h2>
          </form>
        </div>
      </div>
    )
  );
}
