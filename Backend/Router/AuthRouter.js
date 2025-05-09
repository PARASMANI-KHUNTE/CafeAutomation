const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    updateUser, 
    deleteUser, 
    getAllUsers,
    forgotPassword,
    resetPassword,
    verifyOtpOnly
} = require('../Controller/AuthController');
const { authenticateToken } = require('../Middleware/AuthMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticateToken, getAllUsers);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtpOnly);
router.post('/reset-password', resetPassword);

module.exports = router;
