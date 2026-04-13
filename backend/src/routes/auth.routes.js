const express = require('express');
const { signup, login, getCurrentUser, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
