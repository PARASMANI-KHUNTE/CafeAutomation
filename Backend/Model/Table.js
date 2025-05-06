const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    tableNumber: {
        type: Number,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'reserved'],
        default: 'available',
    },
    qrCode: {
        type: String,
        unique: true
    },
    capacity: {
        type: Number,
        default: 4,
        min: 1
    },
    location: {
        type: String,
        enum: ['indoor', 'outdoor', 'balcony', 'private'],
        default: 'indoor'
    },
    currentOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    lastOccupiedAt: {
        type: Date,
        default: null
    }
});

const Table = mongoose.model('Table', tableSchema);

module.exports = Table;
