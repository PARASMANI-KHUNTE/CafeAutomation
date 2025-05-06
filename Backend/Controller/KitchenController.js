const Kitchen = require('../Model/Kitchen');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const JWT_SECRET  = process.env.JWT_SECRET;

const createKitchen = async (req, res) => {
    const {name, password } = req.body;
    try {
        const hashedPassword = await argon2.hash(password);
        const kitchen = new Kitchen({name, password: hashedPassword });
        await kitchen.save();
        return res.status(201).json({ message: 'Kitchen created successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const loginKitchen = async (req, res) => {
    const { name , password } = req.body;
    try {
        if (!name || !password) {
            return res.status(400).json({ message: 'Name and password are required' });
        }
        const kitchen = await Kitchen.findOne({ name });
        if (!kitchen) {
            return res.status(401).json({ message: 'Invalid kitchen name' });
        }
        const isPasswordValid = await argon2.verify(kitchen.password, password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
            
        return res.status(200).json({message: 'Login successful' , token });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}


const updteKitchen = async (req, res) => {  
    const { name, password } = req.body;
    try {
        if (!name || !password) {
            return res.status(400).json({ message: 'Name and password are required' });
        }
        const hashedPassword = await argon2.hash(password);
        const kitchen = await Kitchen.findOneAndUpdate({ name }, { password: hashedPassword }, { new: true });
        if (!kitchen) {
            return res.status(404).json({ message: 'Kitchen not found' });
        }
        return res.status(200).json({ message: 'Kitchen updated successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}
const deleteKitchen = async (req, res) => {
    const { name } = req.body;
    try {
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const kitchen = await Kitchen.findOneAndDelete({ name });
        if (!kitchen) {
            return res.status(404).json({ message: 'Kitchen not found' });
        }
        return res.status(200).json({ message: 'Kitchen deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getKitchen = async (req, res) => {
    try {
        const kitchens = await Kitchen.find();
        return res.status(200).json(kitchens);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}
const getKitchenById = async (req, res) => {
    const { id } = req.params;
    try {
        const kitchen = await Kitchen.findById(id);
        if (!kitchen) {
            return res.status(404).json({ message: 'Kitchen not found' });
        }
        return res.status(200).json(kitchen);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}


module.exports = {
    createKitchen,
    loginKitchen,
    updteKitchen,
    deleteKitchen,
    getKitchen,
    getKitchenById
}
