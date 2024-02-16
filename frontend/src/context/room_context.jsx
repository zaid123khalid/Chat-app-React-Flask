import { useContext, createContext, useState } from "react";

const RoomContext = createContext(null);

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoomContext must be used within a RoomProvider");
  }

  return useContext(RoomContext);
};

export const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState("");
  const [messages, setMessages] = useState([]);
  return (
    <RoomContext.Provider
      value={{
        rooms,
        setRooms,
        activeRoom,
        setActiveRoom,
        messages,
        setMessages,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
