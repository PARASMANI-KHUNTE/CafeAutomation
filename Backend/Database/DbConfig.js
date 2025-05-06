const mongoose = require('mongoose');
const mongodbUri = process.env.MONGODB_URI ;
const DbName = process.env.DB_NAME;

const connectDB = async () => {
    try {
        await mongoose.connect(`${mongodbUri}/${DbName}`);
        console.log(`MongoDB connected to ${DbName}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit the process with failure
    }
    }

module.exports = connectDB;