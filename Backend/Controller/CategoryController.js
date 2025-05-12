const Category = require('../Model/Category');

// Create a new category
const createCategory = async (req, res) => {
    const { name, description, isActive } = req.body;
    
    try {
        // Check if category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        // Create new category
        const category = await Category.create({ 
            name, 
            description, 
            isActive: isActive !== undefined ? isActive : true
        });
        
        return res.status(201).json(category);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Update an existing category
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    
    try {
        // Find category by ID
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if new name already exists (if name is being changed)
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }
        }

        // Update category fields
        if (name) category.name = name;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();
        return res.status(200).json(category);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Delete a category
const deleteCategory = async (req, res) => {
    const { id } = req.params;
    
    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        // Check if category is in use by any menu items
        const Menu = require('../Model/Menu');
        const menuItemsWithCategory = await Menu.countDocuments({ category: category.name });
        
        if (menuItemsWithCategory > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete category as it is used by menu items',
                count: menuItemsWithCategory
            });
        }
        
        await Category.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get a single category by ID
const getCategory = async (req, res) => {
    const { id } = req.params;
    
    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        return res.status(200).json(category);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        return res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    getCategory, 
    getAllCategories 
};
