import { createContext, useContext, useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  // Create stable socket instance
  useEffect(() => {
    if (user) {
      // Cleanup existing socket
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }

      const newSocket = io("http://localhost:5000", {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        timeout: 10000,
        transports: ["websocket", "polling"],
      });

      socketRef.current = newSocket;

      newSocket.on("connect", () => {
        console.log("[SOCKET] Connected:", newSocket.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Authenticate immediately on connect
        const token = localStorage.getItem("token");
        if (token) {
          console.log("[SOCKET] Sending authentication...");
          newSocket.emit("authenticate", token);
        }
      });

      newSocket.on("authenticated", (data) => {
        console.log("[SOCKET] Authenticated successfully", data);
        setIsAuthenticated(true);
      });

      newSocket.on("auth-error", (error) => {
        console.error("[SOCKET] Auth error:", error);
        setIsAuthenticated(false);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("[SOCKET] Disconnected:", reason);
        setIsConnected(false);
        setIsAuthenticated(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("[SOCKET] Connection error:", error.message);
        reconnectAttempts.current++;
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("[SOCKET] Reconnected after", attemptNumber, "attempts");
      });

      setSocket(newSocket);

      return () => {
        console.log("[SOCKET] Cleaning up socket");
        newSocket.removeAllListeners();
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsAuthenticated(false);
        setIsConnected(false);
      };
    } else {
      // No user - cleanup socket
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsAuthenticated(false);
      setIsConnected(false);
    }
  }, [user]);

  // Provide stable reference
  const value = {
    socket,
    isAuthenticated,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
