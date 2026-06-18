const express = require('express');
const AlertController = require('../controllers/AlertController');

const router = express.Router();

// Get all alerts
router.get('/', AlertController.getAll);

// Get alerts by device
router.get('/device/:deviceId', AlertController.getByDevice);

// Get alerts by class
router.get('/class/:classId', AlertController.getByClass);

// Get unread count
router.get('/count/unread', AlertController.getUnreadCount);

// Get summary
router.get('/summary/stats', AlertController.getSummary);

// Create alert from raw device event payload
router.post('/device-event', AlertController.createDeviceEvent);

// Get alert by ID
router.get('/:id', AlertController.getById);

// Create new alert
router.post('/', AlertController.create);

// Update alert
router.put('/:id', AlertController.update);

// Mark alert as read
router.patch('/:id/read', AlertController.markAsRead);

// Mark all alerts as read
router.patch('/read/all', AlertController.markAllAsRead);

// Delete alert
router.delete('/:id', AlertController.delete);

module.exports = router;
