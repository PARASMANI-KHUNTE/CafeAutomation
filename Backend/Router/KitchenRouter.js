const {createKitchen,
    loginKitchen,
    updteKitchen,
    deleteKitchen,
    getKitchen,
    getKitchenById} = require('../Controllers/KitchenController');
const express = require('express');
const router = express.Router();

router.post('/create', createKitchen);
router.post('/login', loginKitchen);
router.put('/update', updteKitchen);
router.delete('/delete', deleteKitchen);
router.get('/get', getKitchen);
router.get('/get/:id', getKitchenById);

module.exports = router;