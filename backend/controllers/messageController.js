// controllers/messageController.js - Message operations
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    cb(isValid ? null : new Error('File type not allowed'), isValid);
  },
});

//Get conversation between two users
//GET /api/messages/:userId
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
      isDeleted: false,
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark incoming messages as seen
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, status: { $ne: 'seen' } },
      { status: 'seen' }
    );

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      page: Number(page),
    });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

//Delete a message
//DELETE /api/messages/:messageId
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

//Upload file/image
//POST /api/messages/upload
const uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const fileUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
      const isImage = /jpeg|jpg|png|gif|webp/.test(path.extname(req.file.originalname).toLowerCase());

      res.json({
        success: true,
        fileUrl,
        fileName: req.file.originalname,
        type: isImage ? 'image' : 'file',
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'File upload failed' });
    }
  },
];

module.exports = { getMessages, deleteMessage, uploadFile };
