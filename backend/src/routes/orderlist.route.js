const express = require('express');
const { addToOrderList, saveToStorage } = require('../controllers/orderlist.controller');

const router = express.Router();

// Route to add a book to the order list (cart)
router.post('/add', addToOrderList);

// Route to save the order list to storage (for mobile apps)
router.get('/save-to-storage', saveToStorage);

module.exports = router;