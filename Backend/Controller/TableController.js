const Table = require('../Model/Table');

const createTable = async (req, res) => {
    const { tableNumber, capacity, location } = req.body;
    try {
        const existingTable = await Table.findOne({ tableNumber });
        if (existingTable) {
            return res.status(400).json({ message: 'Table already exists' });
        }
        
        // Generate a unique QR code for the table (base URL + table number)
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrCode = `${baseUrl}/table/${tableNumber}`;
        
        // Create table with optional fields if provided
        const tableData = { 
            tableNumber, 
            qrCode,
            ...(capacity && { capacity }),
            ...(location && { location })
        };
        
        const table = await Table.create(tableData);
        return res.status(201).json(table);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const updateTable = async (req, res) => {
    const { tableNumber, status, capacity, location } = req.body;
    try {
        // Check if table number is being changed and if it already exists
        if (tableNumber) {
            const existingTable = await Table.findOne({ 
                tableNumber, 
                _id: { $ne: req.params.id } 
            });
            
            if (existingTable) {
                return res.status(400).json({ message: 'Table number already in use' });
            }
        }
        
        // Prepare update data with only provided fields
        const updateData = {};
        if (tableNumber) updateData.tableNumber = tableNumber;
        if (status) updateData.status = status;
        if (capacity) updateData.capacity = capacity;
        if (location) updateData.location = location;
        
        // Update QR code if table number changes
        if (tableNumber) {
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            updateData.qrCode = `${baseUrl}/table/${tableNumber}`;
        }
        
        // Update lastOccupiedAt if status changes to occupied
        if (status === 'occupied') {
            updateData.lastOccupiedAt = new Date();
        }
        
        const table = await Table.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        );
        
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        
        return res.status(200).json(table);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const deleteTable = async (req, res) => {
    const { id } = req.params;
    try {
        const table = await Table.findByIdAndDelete(id);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        return res.status(200).json({ message: 'Table deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getTable = async (req, res) => {
    const { id } = req.params;
    try {
        const table = await Table.findById(id);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        return res.status(200).json(table);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }   
}

const getAllTables = async (req, res) => {
    try {
        const tables = await Table.find();
        return res.status(200).json(tables);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getAvailableTables = async (req, res) => {
    try {
        const tables = await Table.find({ status: 'available' });
        return res.status(200).json(tables);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const updateTableStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const table = await Table.findByIdAndUpdate(id, { status }, { new: true }); 
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        return res.status(200).json(table);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}
const getTableByNumber = async (req, res) => {
    const { number } = req.params;
    try {
        const table = await Table.findOne({ tableNumber: number });
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        return res.status(200).json(table);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { createTable, updateTable, deleteTable, getTable, getAllTables, getAvailableTables, updateTableStatus, getTableByNumber };

