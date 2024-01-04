import send from "../assets/send-50.png";

export default function ChatInput({ newMsg_, setNewMsg_, sendMessage_ }) {
  return (
    <div
      className="chat-input"
      onKeyUp={(e) => {
        if (e.key === "Enter") {
          sendMessage_();
        }
      }}
    >
      <input
        type="text"
        placeholder="Enter Message"
        value={newMsg_}
        onChange={(e) => setNewMsg_(e.target.value)}
      />
      <button type="submit" className="send-btn" onClick={sendMessage_}>
        <img
          src={send}
          width="25"
          height="25"
          alt=""
          srcSet=""
          style={{ rotate: "10deg" }}
        />
      </button>
    </div>
  );
}
