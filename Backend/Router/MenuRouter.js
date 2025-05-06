const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createMenu, updateMenu, deleteMenu, getMenu, getAllMenu } = require('../Controller/MenuController');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Create menu with image upload
router.post('/', upload.single('image'), createMenu);

// Update menu with optional image upload
router.put('/:id', upload.single('image'), updateMenu);

// Delete menu
router.delete('/:id', deleteMenu);

// Get single menu
router.get('/:id', getMenu);

// Get all menus
router.get('/', getAllMenu);

module.exports = router;
