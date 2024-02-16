import { Link } from "react-router-dom";

export default function Not_Found() {
  return (
    <div
      className="
    not-found"
    >
      <h1>404: Not Found</h1>
      <p>Go Back to Chat Page {<Link to="/chat">Chat</Link>}</p>
    </div>
  );
}
