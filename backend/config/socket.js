// config/socket.js - Socket.io event handlers
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Map to track online users: userId -> socketId
const onlineUsers = new Map();

module.exports = (io) => {
  // Middleware: authenticate socket connections via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: no token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: user not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected: ${userId}`);

    // Register user as online
    onlineUsers.set(userId, socket.id);

    // Update user status in DB
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Broadcast online status to all clients
    io.emit('user:online', { userId, isOnline: true });

    // Send current online users list to the newly connected user
    socket.emit('users:online', Array.from(onlineUsers.keys()));

    // ─── PRIVATE MESSAGING ───────────────────────────────────────────────
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content, type = 'text', fileUrl } = data;

        // Save message to MongoDB
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content,
          type,
          fileUrl,
          status: 'sent',
        });

        const populatedMessage = await message.populate([
          { path: 'sender', select: 'username avatar' },
          { path: 'receiver', select: 'username avatar' },
        ]);

        // Emit to sender (confirmation)
        socket.emit('message:sent', populatedMessage);

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:receive', populatedMessage);

          // Mark as delivered immediately if receiver is online
          await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
          socket.emit('message:status', { messageId: message._id, status: 'delivered' });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
        console.error('message:send error:', err);
      }
    });

    // ─── TYPING INDICATORS ───────────────────────────────────────────────
    socket.on('typing:start', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:start', { senderId: userId });
      }
    });

    socket.on('typing:stop', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:stop', { senderId: userId });
      }
    });

    // ─── MESSAGE SEEN STATUS ─────────────────────────────────────────────
    socket.on('message:seen', async ({ senderId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, sender: senderId, receiver: userId },
          { status: 'seen' }
        );

        // Notify sender their messages were seen
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:seen', { messageIds, seenBy: userId });
        }
      } catch (err) {
        console.error('message:seen error:', err);
      }
    });

    // ─── MESSAGE REACTION ────────────────────────────────────────────────
    socket.on('message:react', async ({ messageId, emoji, receiverId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Toggle reaction
        const existingIdx = message.reactions.findIndex(
          r => r.user.toString() === userId && r.emoji === emoji
        );
        if (existingIdx > -1) {
          message.reactions.splice(existingIdx, 1);
        } else {
          message.reactions.push({ user: userId, emoji });
        }
        await message.save();

        // Broadcast to both users
        const receiverSocketId = onlineUsers.get(receiverId);
        const reactionData = { messageId, reactions: message.reactions };
        socket.emit('message:reacted', reactionData);
        if (receiverSocketId) io.to(receiverSocketId).emit('message:reacted', reactionData);
      } catch (err) {
        console.error('message:react error:', err);
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${userId}`);
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user:online', { userId, isOnline: false });
    });
  });
};
