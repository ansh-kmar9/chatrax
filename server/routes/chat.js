import express from "express";
import { auth } from "../middleware/auth.js";
import Message from "../models/Message.js";
import FriendRequest from "../models/FriendRequest.js";
import { broadcastMessage, emitToUser } from "../socket/socketHandlers.js";

const router = express.Router();

// Get messages between two users
router.get("/:friendId", auth, async (req, res) => {
  try {
    const { friendId } = req.params;

    // Check if they are friends
    const friendship = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: friendId, status: "accepted" },
        { sender: friendId, receiver: req.user._id, status: "accepted" },
      ],
    });

    if (!friendship) {
      return res
        .status(403)
        .json({ message: "You can only chat with friends" });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: friendId },
        { sender: friendId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender receiver", "-password");

    // Mark messages as read
    await Message.updateMany(
      { sender: friendId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    // Emit read receipt to friend
    emitToUser(friendId, "messages-read", {
      readBy: req.user._id.toString(),
    });

    res.json({ messages });
  } catch (error) {
    console.error("[CHAT] Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send message
router.post("/", auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Check if they are friends
    const friendship = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverId, status: "accepted" },
        { sender: receiverId, receiver: req.user._id, status: "accepted" },
      ],
    });

    if (!friendship) {
      return res
        .status(403)
        .json({ message: "You can only chat with friends" });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content: content.trim(),
    });

    await message.save();
    await message.populate("sender receiver", "-password");

    // Broadcast to both sender and receiver via socket
    broadcastMessage(message);

    console.log(`[CHAT] Message sent: ${req.user._id} -> ${receiverId}`);

    res.status(201).json({ message });
  } catch (error) {
    console.error("[CHAT] Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get unread message count
router.get("/unread/count", auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get unread message count per friend
router.get("/unread/per-friend", auth, async (req, res) => {
  try {
    const unreadMessages = await Message.aggregate([
      {
        $match: {
          receiver: req.user._id,
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object for easier lookup
    const unreadCounts = {};
    unreadMessages.forEach((item) => {
      unreadCounts[item._id.toString()] = item.count;
    });

    res.json({ unreadCounts });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Mark messages as read from a specific friend
router.put("/mark-read/:friendId", auth, async (req, res) => {
  try {
    const { friendId } = req.params;

    // Mark messages as read
    await Message.updateMany(
      { sender: friendId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    // Emit socket event to sender that messages were read
    emitToUser(friendId, "messages-read", {
      readBy: req.user._id.toString(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
