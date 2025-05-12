const Order = require('../Model/Order');
const Table = require('../Model/Table');
const socketManager = require('../Utils/SocketManager');

const createOrder = async (req, res) => {
    try {
        console.log('Create order request body:', JSON.stringify(req.body, null, 2));
        
        const { 
            tableId, 
            items, 
            totalAmount, 
            customerName, 
            customerPhone, 
            sessionToken: bodySessionToken,
            discounts,
            discountAmount,
            finalAmount 
        } = req.body;
        // Get session token from header or body
        const sessionToken = req.headers['x-session-token'] || bodySessionToken || 'guest-' + Date.now();

        console.log('Processing order with tableId:', tableId, 'and sessionToken:', sessionToken);

        if (!tableId) {
            return res.status(400).json({ message: 'Table ID is required' });
        }
        
        // Validate items array
        if (!items) {
            return res.status(400).json({ message: 'Items are required' });
        }
        
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: 'Items must be an array' });
        }
        
        if (items.length === 0) {
            return res.status(400).json({ message: 'Items array cannot be empty' });
        }

        // Validate each item in the array
        const validatedItems = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            console.log(`Processing item ${i}:`, JSON.stringify(item, null, 2));
            
            // Ensure each item has the required properties
            if (!item.menuItem) {
                return res.status(400).json({ 
                    message: `Item at index ${i} is missing menuItem property`,
                    item: item
                });
            }
            
            // Create a validated item object
            validatedItems.push({
                menuItem: item.menuItem,
                quantity: item.quantity || 1,
                price: item.price || 0,
                notes: item.notes || ''
            });
        }

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

        // Create new order with session token and validated items
        const orderData = { 
            tableId, 
            items: validatedItems, 
            sessionToken,
            status: 'pending'
        };
        
        // Calculate totalAmount if not provided
        if (totalAmount) {
            orderData.totalAmount = totalAmount;
        } else {
            // Calculate total from the items
            orderData.totalAmount = validatedItems.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        }
        
        // Add optional fields if they exist
        if (customerName) orderData.customerName = customerName;
        if (customerPhone) orderData.customerPhone = customerPhone;
        
        // Add discount information if available
        if (discounts) orderData.discounts = discounts;
        if (discountAmount) orderData.discountAmount = discountAmount;
        if (finalAmount) orderData.finalAmount = finalAmount;
        
        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
        
        const order = await Order.create(orderData);

        // Populate the menu items and table for the Socket.io event
        const populatedOrder = await Order.findById(order._id)
            .populate('items.menuItem')
            .populate('tableId');
        
        // Emit new order event to kitchen staff
        socketManager.emitNewOrder(populatedOrder);

        return res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ message: 'Server error', details: error.message });
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
    
    console.log('Adding items to order:', id);
    console.log('Request body:', req.body);
    
    // Validate input with more detailed error messages
    if (!items) {
        return res.status(400).json({ message: 'Items are required' });
    }
    
    if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'Items must be an array' });
    }
    
    if (items.length === 0) {
        return res.status(400).json({ message: 'Items array cannot be empty' });
    }
    
    // Validate each item in the array
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.menuItem) {
            return res.status(400).json({ 
                message: `Item at index ${i} is missing menuItem property`,
                item: item
            });
        }
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

        // Only allow adding items if the order is in pending, accepted, or preparing status
        // Adding preparing status to allow adding items while the order is being prepared
        if (!['pending', 'accepted', 'preparing'].includes(order.status)) {
            return res.status(400).json({ 
                message: 'Cannot add items to an order that is already completed or denied'
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

// Handle customer assistance requests
const requestAssistance = async (req, res) => {
    const { orderId, customerName, tableNumber, message } = req.body;

    if (!orderId || !tableNumber) {
        return res.status(400).json({ message: 'Order ID and table number are required' });
    }

    try {
        // Get the order to verify it exists
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Create alert data
        const alertData = {
            orderId,
            customerName: customerName || 'Customer',
            tableNumber,
            message: message || 'Assistance needed',
            timestamp: new Date()
        };

        // Emit the alert via Socket.io
        socketManager.emitCustomerAssistanceAlert(alertData);

        return res.status(200).json({ 
            success: true, 
            message: 'Assistance request sent successfully' 
        });
    } catch (error) {
        console.error('Error requesting assistance:', error);
        return res.status(500).json({ 
            message: 'Failed to request assistance', 
            error: error.message 
        });
    }
};

module.exports = { createOrder, updateOrder, deleteOrder, getOrder, getAllOrders, addMoreItems, getCustomerOrders, requestAssistance };

