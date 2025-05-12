const express = require('express');
const router = express.Router();
const discountController = require('../Controller/DiscountController');
const { verifyToken, isAdmin } = require('../Middleware/AuthMiddleware');

// PUBLIC ENDPOINTS (no authentication required)
// These must be defined BEFORE the parameterized routes to avoid conflicts

// Get all active discounts (public endpoint for menu display)
router.get('/active', discountController.getActiveDiscounts);

// Calculate applicable discounts for a bill (public to allow customer-side calculation)
router.post('/calculate-bill', discountController.calculateDiscountsForBill);

// AUTHENTICATED ENDPOINTS

// Get all discounts
router.get('/', verifyToken, discountController.getAllDiscounts);

// Get discounts applicable to a specific item
router.get('/item/:itemId', verifyToken, discountController.getDiscountsForItem);

// Create a new discount (admin only)
router.post('/', verifyToken, isAdmin, discountController.createDiscount);

// PARAMETERIZED ROUTES (must come after specific routes)

// Get a single discount by ID
router.get('/:id', verifyToken, discountController.getDiscountById);

// Update an existing discount (admin only)
router.put('/:id', verifyToken, isAdmin, discountController.updateDiscount);

// Delete a discount (admin only)
router.delete('/:id', verifyToken, isAdmin, discountController.deleteDiscount);

// Toggle discount active status (admin only)
router.patch('/:id/toggle', verifyToken, isAdmin, discountController.toggleDiscountStatus);

module.exports = router;
