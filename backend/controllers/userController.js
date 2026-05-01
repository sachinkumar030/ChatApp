// controllers/userController.js - User operations
const User = require('../models/User');
const Message = require('../models/Message');

//Get all users (except current user)
//GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username email avatar bio isOnline lastSeen')
      .sort({ isOnline: -1, username: 1 });

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

//Get users with recent conversations (sidebar)
//GET /api/users/conversations
const getUsersWithConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all users this user has exchanged messages with
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).sort({ createdAt: -1 });

    // Get unique user IDs from conversations
    const userIds = new Set();
    messages.forEach(msg => {
      const otherId = msg.sender.toString() === userId.toString()
        ? msg.receiver.toString()
        : msg.sender.toString();
      userIds.add(otherId);
    });

    // Fetch those users
    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select('username email avatar bio isOnline lastSeen');

    // Attach last message and unread count
    const usersWithMeta = await Promise.all(users.map(async (user) => {
      const lastMessage = await Message.findOne({
        $or: [
          { sender: userId, receiver: user._id },
          { sender: user._id, receiver: userId },
        ],
      }).sort({ createdAt: -1 });

      const unreadCount = await Message.countDocuments({
        sender: user._id,
        receiver: userId,
        status: { $ne: 'seen' },
      });

      return {
        ...user.toObject(),
        lastMessage,
        unreadCount,
      };
    }));

    // Sort by last message time
    usersWithMeta.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || 0;
      const bTime = b.lastMessage?.createdAt || 0;
      return new Date(bTime) - new Date(aTime);
    });

    res.json({ success: true, users: usersWithMeta });
  } catch (err) {
    console.error('getUsersWithConversations error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

//Search users by username
//GET /api/users/search?q=query
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, users: [] });

    const users = await User.find({
      _id: { $ne: req.user._id },
      username: { $regex: q, $options: 'i' },
    }).select('username email avatar isOnline').limit(10);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

module.exports = { getUsers, getUsersWithConversations, searchUsers };
