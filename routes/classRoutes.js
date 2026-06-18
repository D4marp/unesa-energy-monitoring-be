const express = require('express');
const ClassController = require('../controllers/ClassController');

const router = express.Router();

// Get all classes
router.get('/', ClassController.getAll);

// Get class by ID
router.get('/:id', ClassController.getById);

// Create new class
router.post('/', ClassController.create);

// Update class
router.put('/:id', ClassController.update);

// Delete class
router.delete('/:id', ClassController.delete);

module.exports = router;
