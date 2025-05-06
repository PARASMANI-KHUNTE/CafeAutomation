const express = require('express');
const router = express.Router();
const { createTable, updateTable, deleteTable, getTable, getAllTables, getAvailableTables, updateTableStatus, getTableByNumber } = require('../Controller/TableController');

router.post('/', createTable);
router.get('/', getAllTables);
router.get('/available', getAvailableTables);
router.get('/number/:number', getTableByNumber);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);
router.get('/:id', getTable);
router.put('/:id/status', updateTableStatus);

module.exports = router;

