const express = require('express');
const ConsumptionController = require('../controllers/ConsumptionController');

const router = express.Router();

// Get consumption by device
router.get('/device/:deviceId', ConsumptionController.getByDevice);

// Get consumption by class
router.get('/class/:classId', ConsumptionController.getByClass);

// Get daily consumption for device
router.get('/daily/:deviceId', ConsumptionController.getDaily);

// Get monthly consumption for device
router.get('/monthly/:deviceId', ConsumptionController.getMonthly);

// Get monthly trend for last N months
router.get('/monthly-trend/:deviceId', ConsumptionController.getMonthlyTrend);

// Get monthly AC/LAMP trend summary (optionally per class)
router.get('/monthly-trend-summary', ConsumptionController.getMonthlyTrendSummary);

// Get total consumption by class
router.get('/total/class/:classId', ConsumptionController.getTotalByClass);

// Get hourly aggregated data
router.get('/hourly/class/:classId', ConsumptionController.getHourlyAggregated);

// Create consumption record
router.post('/', ConsumptionController.create);

// Bulk insert consumption records
router.post('/bulk', ConsumptionController.bulkCreate);

// Delete consumption record
router.delete('/:id', ConsumptionController.delete);

module.exports = router;
