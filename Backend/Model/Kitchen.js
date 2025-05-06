const mongoose = require('mongoose');

const kitchenSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
})

const Kitchen = mongoose.model('Kitchen', kitchenSchema);

module.exports = Kitchen;
