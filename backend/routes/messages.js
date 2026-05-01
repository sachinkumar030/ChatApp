// routes/messages.js
const express = require('express');
const router = express.Router();
const { getMessages, deleteMessage, uploadFile } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:userId', getMessages);
router.delete('/:messageId', deleteMessage);
router.post('/upload', uploadFile);

module.exports = router;
