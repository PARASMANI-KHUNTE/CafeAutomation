const express = require('express');
const router = express.Router();
const { createOrder, updateOrder, deleteOrder, getOrder, getAllOrders, addMoreItems, getCustomerOrders, requestAssistance } = require('../Controller/OrderController');
const { authenticateToken } = require('../Middleware/AuthMiddleware');

router.post('/', createOrder);
router.get('/customer', getCustomerOrders);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);
router.get('/:id', getOrder);
router.get('/', getAllOrders);
router.post('/:id/items', addMoreItems);
router.post('/assistance', requestAssistance);

module.exports = router;
