import { useState, useContext, createContext } from "react";

const FriendContext = createContext(null);

export const FriendProvider = ({ children }) => {
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState("");
  const [friendsMessages, setFriendsMessages] = useState([]);

  return (
    <FriendContext.Provider
      value={{
        friends,
        setFriends,
        activeFriend,
        setActiveFriend,
        friendsMessages,
        setFriendsMessages,
      }}
    >
      {children}
    </FriendContext.Provider>
  );
};

export const useFriendContext = () => {
  const context = useContext(FriendContext);
  if (!context) {
    throw new Error("useFriendContext must be used within a FriendProvider");
  }

  return useContext(FriendContext);
};
