// routes/users.js
const express = require('express');
const router = express.Router();
const { getUsers, getUsersWithConversations, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect); // All user routes require auth

router.get('/', getUsers);
router.get('/conversations', getUsersWithConversations);
router.get('/search', searchUsers);

module.exports = router;
