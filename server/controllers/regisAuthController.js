import express from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { verifyGoogleToken } from "../config/google.js";
import Trial from "../models/Trial.js"; // MongoDB model for trials (we’ll define it below)

const Regisrouter = express.Router();
const JWT_SECRET = "emeka";

// Session setup
Regisrouter.use(
  session({
    secret: "autopost",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true for HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// ✅ Middleware to check if user is authenticated
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// ✅ Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// ✅ Google Authentication
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Google token is required" });

    const googleData = await verifyGoogleToken(token);
    if (googleData.error) return res.status(401).json({ error: googleData.error });

    const { email, name, picture } = googleData.payload;

    // Check or create user
    let user = await User.findByEmail(email);
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        provider: "google",
        verified: true
      });
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "14d" });

    res.status(200).json({
      status: "success",
      token: jwtToken,
      user
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// ✅ Email Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    const user = await User.create({ name, email, password, provider: "email" });

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      status: "success",
      token,
      user
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

// ✅ Email Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await User.comparePassword(email, password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "14d" });

    res.status(200).json({
      status: "success",
      token,
      user
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

// ✅ Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ status: "success", user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// ✅ Start free trial
export const startTrial = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    const existingTrial = await Trial.findOne({ user_id: userId, status: "active" });
    if (existingTrial)
      return res.status(400).json({ message: "You already have an active trial" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    const trial = await Trial.create({
      user_id: userId,
      plan,
      start_date: startDate,
      end_date: endDate,
      status: "active"
    });

    res.status(201).json({
      message: "Trial started successfully",
      trial
    });
  } catch (error) {
    console.error("Trial start error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get trial status
export const getTrialStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const trial = await Trial.findOne({ user_id: userId, status: "active" });

    if (!trial) return res.status(404).json({ message: "No active trial found" });

    const now = new Date();
    if (now > trial.end_date) {
      trial.status = "expired";
      await trial.save();
      return res.status(404).json({ message: "Trial has expired" });
    }

    res.json({
      active: true,
      trial
    });
  } catch (error) {
    console.error("Trial status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Logout
export const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.clearCookie("autopost.sid");
      res.status(200).json({ status: "success", message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

// ✅ Save post/content
export const saveContent = async (req, res) => {
  try {
    const { id, postDetailsDate, postDetailsPost, postDetailsPlatform } = req.body;

    if (!id) return res.status(401).json({ error: "User is not logged in" });

    await User.uploadPost({ id, postDetailsDate, postDetailsPost, postDetailsPlatform });

    res.status(200).json({ status: "success", data: "Content updated successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

// ✅ Get all user posts
export const getContent = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(401).json({ error: "User ID required" });

    const posts = await User.getPosts(id);
    if (!posts || posts.length === 0)
      return res.status(404).json({ error: "No posts found for this user" });

    res.status(200).json({ status: "success", data: posts });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};
