const express = require('express');
const DeviceController = require('../controllers/DeviceController');

const router = express.Router();

// Get all devices
router.get('/', DeviceController.getAll);

// Get devices by class
router.get('/class/:classId', DeviceController.getByClass);

// Get devices by class code
router.get('/class-code/:classCode', DeviceController.getByClassCode);

// Get devices by type
router.get('/type/:type', DeviceController.getByType);

// Get device by ID
router.get('/:id', DeviceController.getById);

// Create new device
router.post('/', DeviceController.create);

// Update device
router.put('/:id', DeviceController.update);

// Update device status
router.patch('/:id/status', DeviceController.updateStatus);

// Send ON/OFF control command via Node-RED
router.post('/:id/control', DeviceController.controlViaNodeRed);

// Send ON/OFF control command for all devices in a class via Node-RED
router.post('/class-code/:classCode/control', DeviceController.controlClassViaNodeRed);

// Update device reading (power & temperature)
router.patch('/:id/reading', DeviceController.updateReading);

// Delete device
router.delete('/:id', DeviceController.delete);

module.exports = router;
