import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Message from "../models/Message.js";
import jwt from "jsonwebtoken";

// Map userId to socket instance for direct access
const onlineUsers = new Map();

// Export for use in routes to check online status
export const getUserSockets = () => {
  // Return a Map of userId to socketId for compatibility
  const socketMap = new Map();
  onlineUsers.forEach((socket, odId) => {
    socketMap.set(odId, socket.id);
  });
  return socketMap;
};

// Check if user is online - simpler approach
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

// Emit to a specific user directly
export const emitToUser = (userId, event, data) => {
  const userSocket = onlineUsers.get(userId.toString());
  if (userSocket && userSocket.connected) {
    userSocket.emit(event, data);
    return true;
  }
  return false;
};

// Broadcast message to sender and receiver
export const broadcastMessage = (message) => {
  const senderId = message.sender._id.toString();
  const receiverId = message.receiver._id.toString();

  const receiverSocket = onlineUsers.get(receiverId);
  if (receiverSocket && receiverSocket.connected) {
    receiverSocket.emit("new-message", { message });
    console.log(`[BROADCAST] Message sent to receiver ${receiverId}`);
  }

  const senderSocket = onlineUsers.get(senderId);
  if (senderSocket && senderSocket.connected) {
    senderSocket.emit("new-message", { message });
    console.log(`[BROADCAST] Message sent to sender ${senderId}`);
  }
};

export const setupSocketHandlers = (io) => {
  // Store io globally for access in routes
  global.io = io;

  io.on("connection", (socket) => {
    console.log(`[SOCKET] New connection: ${socket.id}`);

    // Handle authentication
    socket.on("authenticate", async (token) => {
      try {
        if (!token) {
          socket.emit("auth-error", { message: "No token provided" });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
          socket.emit("auth-error", { message: "User not found" });
          return;
        }

        // Store user info on socket
        socket.userId = user._id.toString();
        socket.user = user;

        // Handle multiple tabs - disconnect old socket
        const oldSocket = onlineUsers.get(socket.userId);
        if (oldSocket && oldSocket.id !== socket.id) {
          console.log(`[SOCKET] Replacing old socket for ${user.codeName}`);
        }

        // Add to online users
        onlineUsers.set(socket.userId, socket);

        // Join personal room
        socket.join(socket.userId);

        console.log(
          `[SOCKET] ${user.codeName} authenticated | Online: ${onlineUsers.size}`
        );

        // Get friends
        const friendRequests = await FriendRequest.find({
          $or: [{ sender: user._id }, { receiver: user._id }],
          status: "accepted",
        });

        const friendIds = friendRequests.map((req) =>
          req.sender.toString() === socket.userId
            ? req.receiver.toString()
            : req.sender.toString()
        );

        // Notify friends that user is online
        friendIds.forEach((friendId) => {
          const friendSocket = onlineUsers.get(friendId);
          if (friendSocket && friendSocket.connected) {
            friendSocket.emit("user-status", {
              userId: socket.userId,
              isOnline: true,
              lastSeen: new Date(),
            });
          }
        });

        // Send friend statuses to this user
        friendIds.forEach((friendId) => {
          socket.emit("user-status", {
            userId: friendId,
            isOnline: onlineUsers.has(friendId),
            lastSeen: new Date(),
          });
        });

        // Confirm authentication
        socket.emit("authenticated", { userId: socket.userId });
      } catch (error) {
        console.error("[SOCKET] Auth error:", error.message);
        socket.emit("auth-error", { message: "Authentication failed" });
      }
    });

    // Handle sending messages via socket
    socket.on("send-message", async ({ receiverId, content, tempId }) => {
      try {
        if (!socket.userId) {
          socket.emit("message-error", {
            message: "Not authenticated",
            tempId,
          });
          return;
        }

        // Verify friendship
        const friendship = await FriendRequest.findOne({
          $or: [
            { sender: socket.userId, receiver: receiverId, status: "accepted" },
            { sender: receiverId, receiver: socket.userId, status: "accepted" },
          ],
        });

        if (!friendship) {
          socket.emit("message-error", { message: "Not friends", tempId });
          return;
        }

        // Save message
        const message = new Message({
          sender: socket.userId,
          receiver: receiverId,
          content: content.trim(),
        });

        await message.save();
        await message.populate("sender receiver", "-password");

        // Send to receiver
        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket && receiverSocket.connected) {
          receiverSocket.emit("new-message", { message });
        }

        // Send confirmation to sender with tempId for replacement
        socket.emit("message-sent", { message, tempId });
      } catch (error) {
        console.error("[SOCKET] Send message error:", error);
        socket.emit("message-error", { message: "Failed to send", tempId });
      }
    });

    // Handle typing indicator
    socket.on("typing", ({ receiverId, isTyping }) => {
      if (!socket.userId) return;

      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket && receiverSocket.connected) {
        receiverSocket.emit("user-typing", {
          userId: socket.userId,
          isTyping,
        });
      }
    });

    // Handle read receipts
    socket.on("mark-read", async ({ friendId }) => {
      if (!socket.userId) return;

      try {
        await Message.updateMany(
          { sender: friendId, receiver: socket.userId, isRead: false },
          { isRead: true }
        );

        const friendSocket = onlineUsers.get(friendId);
        if (friendSocket && friendSocket.connected) {
          friendSocket.emit("messages-read", { readBy: socket.userId });
        }
      } catch (error) {
        console.error("[SOCKET] Mark read error:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`[SOCKET] Disconnected: ${socket.id}`);

      if (socket.userId) {
        // Only remove if this is the current socket
        const currentSocket = onlineUsers.get(socket.userId);
        if (currentSocket && currentSocket.id === socket.id) {
          onlineUsers.delete(socket.userId);
          console.log(
            `[SOCKET] ${socket.userId} offline | Online: ${onlineUsers.size}`
          );

          try {
            const friendRequests = await FriendRequest.find({
              $or: [{ sender: socket.userId }, { receiver: socket.userId }],
              status: "accepted",
            });

            const friendIds = friendRequests.map((req) =>
              req.sender.toString() === socket.userId
                ? req.receiver.toString()
                : req.sender.toString()
            );

            // Notify friends that user is offline
            friendIds.forEach((friendId) => {
              const friendSocket = onlineUsers.get(friendId);
              if (friendSocket && friendSocket.connected) {
                friendSocket.emit("user-status", {
                  userId: socket.userId,
                  isOnline: false,
                  lastSeen: new Date(),
                });
              }
            });
          } catch (error) {
            console.error("[SOCKET] Disconnect error:", error);
          }
        }
      }
    });
  });

  // Cleanup stale connections every 30 seconds
  setInterval(() => {
    let cleaned = 0;
    onlineUsers.forEach((socket, odId) => {
      if (!socket.connected) {
        onlineUsers.delete(odId);
        cleaned++;
      }
    });
    if (cleaned > 0) {
      console.log(`[SOCKET] Cleaned ${cleaned} stale connections`);
    }
  }, 30000);
};
