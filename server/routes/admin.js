import express from "express";
import { adminAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

const router = express.Router();

// Get all users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select("-password");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all messages (for a specific user or all)
router.get("/messages", adminAuth, async (req, res) => {
  try {
    const { userId } = req.query;

    let query = {};
    if (userId) {
      query = {
        $or: [{ sender: userId }, { receiver: userId }],
      };
    }

    const messages = await Message.find(query)
      .populate("sender receiver", "-password")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user
router.delete("/users/:userId", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete user's messages
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    // Delete user
    await User.findByIdAndDelete(userId);

    // Emit socket event to disconnect user
    const io = req.app.get("io");
    io.to(userId).emit("account-deleted");

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's friends
router.get("/users/:userId/friends", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const FriendRequest = (await import("../models/FriendRequest.js")).default;

    // Find all accepted friend requests where user is sender or receiver
    const friendRequests = await FriendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "accepted",
    }).populate("sender receiver", "-password");

    // Extract friends from the requests
    const friends = friendRequests.map((req) => {
      if (req.sender._id.toString() === userId) {
        return req.receiver;
      } else {
        return req.sender;
      }
    });

    res.json({ friends });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get chat messages between two users
router.get("/chats/:userId/:friendId", adminAuth, async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    })
      .populate("sender receiver", "-password")
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get statistics
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const onlineUsers = await User.countDocuments({
      isOnline: true,
      isAdmin: false,
    });
    const totalMessages = await Message.countDocuments();

    res.json({
      totalUsers,
      onlineUsers,
      totalMessages,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
