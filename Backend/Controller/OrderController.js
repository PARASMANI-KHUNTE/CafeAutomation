const Order = require('../Model/Order');
const Table = require('../Model/Table');
const socketManager = require('../Utils/SocketManager');

const createOrder = async (req, res) => {
    const { tableId, items, totalAmount, customerName, customerPhone } = req.body;
    const sessionToken = req.headers['x-session-token']; // Get session token from header

    if (!tableId) {
        return res.status(400).json({ message: 'Table ID is required' });
    }

    if (!sessionToken) {
        return res.status(400).json({ message: 'Session token is required' });
    }

    try {
        // Check if there's an existing active order for this table
        const existingOrder = await Order.findOne({ 
            tableId,
            status: { $in: ['pending', 'accepted', 'preparing'] }
        });

        if (existingOrder) {
            return res.status(400).json({ 
                message: 'An active order already exists for this table',
                orderId: existingOrder._id
            });
        }

        // Create new order with session token
        const order = await Order.create({ 
            tableId, 
            items, 
            totalAmount,
            sessionToken,
            customerName,
            customerPhone,
            status: 'pending'
        });

        // Populate the menu items and table for the Socket.io event
        const populatedOrder = await Order.findById(order._id)
            .populate('items.menuItem')
            .populate('tableId');
        
        // Emit new order event to kitchen staff
        socketManager.emitNewOrder(populatedOrder);

        return res.status(201).json(order);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const updateOrder = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const order = await Order.findByIdAndUpdate(id, { status }, { new: true })
            .populate('items.menuItem')
            .populate('tableId'); 
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Emit order status update events
        socketManager.emitOrderUpdate(id, order);
        socketManager.emitOrderStatusChange(id, status);
        
        return res.status(200).json(order);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await Order.findByIdAndDelete(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        return res.status(200).json({ message: 'Order deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        return res.status(200).json(order);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('items.menuItem')
            .populate('tableId')
            .sort({ createdAt: -1 }); // Sort by most recent first
        return res.status(200).json(orders);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const addMoreItems = async (req, res) => {
    const { id } = req.params;
    const { items, sessionToken, customerName, customerPhone } = req.body;
    
    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Items array is required and cannot be empty' });
    }

    try {
        // Find the order by ID
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify session token if provided (for customer orders)
        if (sessionToken && order.sessionToken !== sessionToken) {
            return res.status(403).json({ message: 'Not authorized to modify this order' });
        }

        // Only allow adding items if the order is in pending or accepted status
        if (order.status !== 'pending' && order.status !== 'accepted') {
            return res.status(400).json({ 
                message: 'Cannot add items to an order that is already being prepared or completed'
            });
        }

        // Add the new items to the order
        order.items.push(...items);
        
        // Update customer information if provided
        if (customerName && !order.customerName) {
            order.customerName = customerName;
        }
        
        if (customerPhone && !order.customerPhone) {
            order.customerPhone = customerPhone;
        }
        
        // Save the order (totalAmount will be recalculated by the pre-save hook)
        await order.save();
        
        // Return the updated order with populated menu items
        const updatedOrder = await Order.findById(id).populate('items.menuItem').populate('tableId');
        
        // Emit order update event
        socketManager.emitOrderUpdate(id, updatedOrder);
        
        return res.status(200).json(updatedOrder);
    }
    catch (error) {
        console.error('Error adding more items to order:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getCustomerOrders = async (req, res) => {
    try {
        // Get session token from header
        const sessionToken = req.headers['x-session-token'];
        
        if (!sessionToken) {
            return res.status(400).json({ message: 'Session token is required' });
        }
        
        // Get orders for the current customer using their session token
        const orders = await Order.find({ sessionToken })
            .sort({ createdAt: -1 }) // Sort by most recent first
            .populate('items.menuItem') // Populate menu item details
            .populate('tableId'); // Populate table details
        
        return res.status(200).json(orders);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { createOrder, updateOrder, deleteOrder, getOrder, getAllOrders, addMoreItems, getCustomerOrders };

