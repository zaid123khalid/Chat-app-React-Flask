import ChatInput from "./chat_input";
import ChatMessages from "./chat_messages";

export default function FriendRoom({ selectedFriend_, username_, messages }) {
  return (
    <>
      <div className="chat-content">
        <header>
          <h1>
            {selectedFriend_.user1 === username_
              ? selectedFriend_.user2
              : selectedFriend_.user1}
          </h1>
        </header>
        <ChatMessages
          messages={messages}
          username_={username_}
          isRoomChat={false}
          selectedFriend_={selectedFriend_}
        />
        <ChatInput username={username_} selectedFriend_={selectedFriend_} />
      </div>
    </>
  );
}
