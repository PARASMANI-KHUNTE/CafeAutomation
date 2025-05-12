const express = require('express');
const router = express.Router();
const { 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    getCategory, 
    getAllCategories 
} = require('../Controller/CategoryController');
const { verifyToken, isAdmin } = require('../Middleware/AuthMiddleware');

// Create a new category (admin only) - temporarily bypassing admin check for testing
router.post('/', verifyToken, createCategory);

// Update a category (admin only) - temporarily bypassing admin check for testing
router.put('/:id', verifyToken, updateCategory);

// Delete a category (admin only) - temporarily bypassing admin check for testing
router.delete('/:id', verifyToken, deleteCategory);

// Get a single category by ID (all authenticated users)
router.get('/:id', verifyToken, getCategory);

// Get all categories (all authenticated users)
router.get('/', verifyToken, getAllCategories);

module.exports = router;
