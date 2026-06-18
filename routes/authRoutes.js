const express = require('express');
const AuthController = require('../controllers/AuthController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/me', requireAuth, AuthController.me);
router.put('/profile', requireAuth, AuthController.updateProfile);
router.post('/logout', AuthController.logout);

module.exports = router;