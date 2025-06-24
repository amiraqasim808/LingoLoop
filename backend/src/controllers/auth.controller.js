import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// Register a new user
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if ([fullName, email, password].includes("")) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));

    const createdUser = new User({
      fullName,
      email,
      password: hash,
    });

    await createdUser.save();
    generateToken(createdUser._id, res);

    res.status(201).json({
      _id: createdUser._id,
      fullName: createdUser.fullName,
      email: createdUser.email,
      profilePic: createdUser.profilePic,
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Log user in
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.status(400).json({ message: "Invalid login info" });
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid login info" });
    }

    generateToken(foundUser._id, res);

    res.status(200).json({
      _id: foundUser._id,
      fullName: foundUser.fullName,
      email: foundUser.email,
      profilePic: foundUser.profilePic,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
};

// Log user out
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "User logged out" });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// Update profile image
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const currentUserId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Missing profile picture" });
    }

    const upload = await cloudinary.uploader.upload(profilePic);

    const userAfterUpdate = await User.findByIdAndUpdate(
      currentUserId,
      { profilePic: upload.secure_url },
      { new: true }
    );

    res.status(200).json(userAfterUpdate);
  } catch (err) {
    console.error("Profile update failed:", err);
    res.status(500).json({ message: "Could not update profile" });
  }
};

// Check if user is authenticated
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.error("Auth check error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
