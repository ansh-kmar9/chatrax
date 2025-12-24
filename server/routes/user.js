import express from "express";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { isUserOnline } from "../socket/socketHandlers.js";

const router = express.Router();

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Search users by codeName
router.get("/search", auth, async (req, res) => {
  try {
    const { codeName } = req.query;

    if (!codeName) {
      return res.status(400).json({ message: "CodeName is required" });
    }

    const users = await User.find({
      codeName: { $regex: codeName, $options: "i" },
      _id: { $ne: req.user._id },
    })
      .select("-password")
      .limit(10);

    // Get user's friends to check friendship status
    const friendRequests = await FriendRequest.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    });

    // Add friendship status to each user
    const usersWithStatus = users.map((user) => {
      const friendRequest = friendRequests.find(
        (fr) =>
          fr.sender.toString() === user._id.toString() ||
          fr.receiver.toString() === user._id.toString()
      );

      let status = "none";
      if (friendRequest) {
        if (friendRequest.status === "accepted") {
          status = "friends";
        } else if (friendRequest.status === "pending") {
          status =
            friendRequest.sender.toString() === req.user._id.toString()
              ? "sent"
              : "received";
        }
      }

      return {
        ...user.toObject(),
        friendshipStatus: status,
      };
    });

    res.json({ users: usersWithStatus });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's friends
router.get("/friends", auth, async (req, res) => {
  try {
    const acceptedRequests = await FriendRequest.find({
      $or: [
        { sender: req.user._id, status: "accepted" },
        { receiver: req.user._id, status: "accepted" },
      ],
    }).populate("sender receiver", "-password");

    console.log(`[FRIENDS API] Found ${acceptedRequests.length} accepted requests for user ${req.user._id}`);

    const friends = acceptedRequests
      .map((request) => {
        // Determine which user is the friend (not the current user)
        const friend =
          request.sender._id.toString() === req.user._id.toString()
            ? request.receiver
            : request.sender;

        // Skip if friend is null (shouldn't happen but safety check)
        if (!friend) {
          console.log(`[FRIENDS API] Warning: null friend in request ${request._id}`);
          return null;
        }

        // Check if friend is online using helper function
        const online = isUserOnline(friend._id.toString());

        return {
          ...friend.toObject(),
          isOnline: online,
        };
      })
      .filter((friend) => friend !== null); // Remove any null entries

    console.log(`[FRIENDS API] Loaded ${friends.length} friends for user ${req.user.codeName}`);
    res.json({ friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
