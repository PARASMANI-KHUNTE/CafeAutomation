const express = require('express');
const router = express.Router();
const { register, login, updateUser, deleteUser, getAllUsers } = require('../Controller/AuthController');
const { authenticateToken } = require('../Middleware/AuthMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticateToken, getAllUsers);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);

module.exports = router;
