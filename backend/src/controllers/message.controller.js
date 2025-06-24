import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Fetch all users except the current one
export const getUsersForSidebar = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const users = await User.find({ _id: { $ne: currentUserId } }).select(
      "-password"
    );

    res.status(200).json(users);
  } catch (err) {
    console.error("Sidebar user fetch failed:", err.message);
    res.status(500).json({ error: "Server error retrieving users" });
  }
};

// Get all messages between logged-in user and another user
export const getMessages = async (req, res) => {
  try {
    const friendId = req.params.id;
    const me = req.user._id;

    const chatHistory = await Message.find({
      $or: [
        { senderId: me, receiverId: friendId },
        { senderId: friendId, receiverId: me },
      ],
    });

    res.status(200).json(chatHistory);
  } catch (err) {
    console.error("Message fetch error:", err.message);
    res.status(500).json({ error: "Failed to load messages" });
  }
};

// Send a new message (optionally with image)
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const recipientId = req.params.id;
    const authorId = req.user._id;

    let uploadedImageUrl;

    if (image) {
      const cloudRes = await cloudinary.uploader.upload(image);
      uploadedImageUrl = cloudRes.secure_url;
    }

    const messagePayload = new Message({
      senderId: authorId,
      receiverId: recipientId,
      text,
      image: uploadedImageUrl,
    });

    await messagePayload.save();

    const socketId = getReceiverSocketId(recipientId);
    if (socketId) {
      io.to(socketId).emit("newMessage", messagePayload);
    }

    res.status(201).json(messagePayload);
  } catch (err) {
    console.error("Message send failed:", err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
};
