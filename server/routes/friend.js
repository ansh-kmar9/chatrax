import express from "express";
import { auth } from "../middleware/auth.js";
import FriendRequest from "../models/FriendRequest.js";

const router = express.Router();

// Send friend request
router.post("/request", auth, async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (receiverId === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot send friend request to yourself" });
    }

    // Check if request already exists
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverId },
        { sender: receiverId, receiver: req.user._id },
      ],
    });

    if (existing) {
      return res.status(400).json({ message: "Friend request already exists" });
    }

    const friendRequest = new FriendRequest({
      sender: req.user._id,
      receiver: receiverId,
    });

    await friendRequest.save();

    // Emit socket event
    const io = req.app.get("io");
    io.to(receiverId).emit("friend-request", {
      request: await friendRequest.populate("sender", "-password"),
    });

    res
      .status(201)
      .json({ message: "Friend request sent", request: friendRequest });
  } catch (error) {
    console.error("Friend request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get pending friend requests
router.get("/requests", auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: "pending",
    }).populate("sender", "-password");

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Accept/Reject friend request
router.put("/request/:id", auth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const requestId = req.params.id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    friendRequest.status = status;
    await friendRequest.save();

    // Emit socket event
    const io = req.app.get("io");
    io.to(friendRequest.sender.toString()).emit("friend-request-response", {
      request: await friendRequest.populate("receiver", "-password"),
      status,
    });

    res.json({ message: `Friend request ${status}`, request: friendRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
