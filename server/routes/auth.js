import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { fullName, codeName, mobile, password, location } = req.body;

    // Validate required fields
    if (!fullName || !codeName || !mobile || !password || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if codeName already exists
    const existingUser = await User.findOne({
      codeName: codeName.toLowerCase(),
    });
    if (existingUser) {
      return res.status(400).json({ message: "CodeName already taken" });
    }

    // Check if mobile already exists
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res
        .status(400)
        .json({ message: "Mobile number already registered" });
    }

    // Create new user
    const user = new User({
      fullName,
      codeName: codeName.toLowerCase(),
      mobile,
      password,
      location,
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "strict",
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        codeName: user.codeName,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { codeName, password, location } = req.body;

    const user = await User.findOne({ codeName: codeName.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last seen and location if provided
    user.lastSeen = new Date();
    if (location && location.latitude && location.longitude) {
      user.location = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        codeName: user.codeName,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check codeName uniqueness
router.post("/check-codename", async (req, res) => {
  try {
    const { codeName } = req.body;
    const user = await User.findOne({ codeName: codeName.toLowerCase() });
    res.json({ available: !user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    // Just clear the cookie - socket disconnect handles online status
    res.clearCookie("token");
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.clearCookie("token");
    res.json({ message: "Logout successful" });
  }
});

export default router;
