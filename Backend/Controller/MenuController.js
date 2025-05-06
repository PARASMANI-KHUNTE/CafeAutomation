const Menu = require('../Model/Menu');
const { uploadImage, deleteImage, updateImage } = require('../Utils/ImageHandler');

const createMenu = async (req, res) => {
    const { name, price, description, category, isAvailable } = req.body;
    const file = req.file;
    try {
        const imageUrl = await uploadImage(file);
        const menu = await Menu.create({ 
            name, 
            price, 
            description, 
            image: imageUrl, 
            category, 
            isAvailable: isAvailable === 'true' 
        });
        return res.status(201).json(menu);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const updateMenu = async (req, res) => {
    const { id } = req.params;
    const { name, price, description, category, isAvailable } = req.body;
    const file = req.file;
    try {
        const menu = await Menu.findById(id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }

        // Update basic info
        menu.name = name;
        menu.price = price;
        menu.description = description;
        menu.category = category;
        menu.isAvailable = isAvailable === 'true';

        // Update image if new one is provided
        if (file) {
            const imageUrl = await updateImage(file);
            if (imageUrl) {
                menu.image = imageUrl;
            }
        }

        await menu.save();
        return res.status(200).json(menu);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const deleteMenu = async (req, res) => {
    const { id } = req.params;
    try {
        const menu = await Menu.findById(id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }   
        if (menu.image) {
            await deleteImage(menu.image);
        }
        await Menu.findByIdAndDelete(id);  
        return res.status(200).json({ message: 'Menu deleted successfully' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getMenu = async (req, res) => {
    const { id } = req.params;
    try {
        const menu = await Menu.findById(id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        return res.status(200).json(menu);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

const getAllMenu = async (req, res) => {
    try {
        const menu = await Menu.find();
        return res.status(200).json(menu);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { createMenu, updateMenu, deleteMenu, getMenu, getAllMenu };
