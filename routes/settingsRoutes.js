const express = require('express');
const SettingsController = require('../controllers/SettingsController');

const router = express.Router();

// Get all system settings
router.get('/', SettingsController.getAll);

// Get setting by key
router.get('/:key', SettingsController.getByKey);

// Set/update setting
router.post('/', SettingsController.set);

// Update setting by key
router.put('/:key', SettingsController.update);

// Get user settings
router.get('/user/:userId', SettingsController.getUserSettings);

// Update user settings
router.put('/user/:userId', SettingsController.updateUserSettings);

// Delete setting
router.delete('/:key', SettingsController.delete);

module.exports = router;
