const Alert = require('../models/Alert');

class AlertController {
  static buildDeviceEventAlert(body = {}) {
    const eventDescription = body.eventDescription || 'Device event received';
    const normalizedDescription = String(eventDescription).toLowerCase();
    const isFailure = normalizedDescription.includes('failed') || normalizedDescription.includes('error') || normalizedDescription.includes('alarm');

    return {
      device_id: body.device_id || null,
      class_id: body.class_id || null,
      type: isFailure ? 'warning' : 'info',
      title: `1T342MFX Event - ${body.major ?? 'N/A'}.${body.minor ?? 'N/A'}`,
      message: [
        eventDescription,
        body.time ? `Time: ${body.time}` : null,
        body.serialNo ? `Serial: ${body.serialNo}` : null,
        body.currentVerifyMode ? `Verify: ${body.currentVerifyMode}` : null,
        body.doorNo ? `Door: ${body.doorNo}` : null,
      ].filter(Boolean).join(' | '),
      severity: isFailure ? 'high' : 'medium',
      metadata: {
        source: '1T342MFX',
        ...body,
      },
    };
  }

  static async getAll(req, res) {
    try {
      const { type, severity, status, readStatus } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (severity) filters.severity = severity;
      if (status) filters.status = status;
      if (readStatus !== undefined) filters.readStatus = readStatus === 'true';

      const alerts = await Alert.getAll(filters);

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const alert = await Alert.getById(id);

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getByDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const alerts = await Alert.getByDevice(deviceId);

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getByClass(req, res) {
    try {
      const { classId } = req.params;
      const alerts = await Alert.getByClass(classId);

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async create(req, res) {
    try {
      const {
        device_id,
        class_id,
        type,
        title,
        message,
        severity,
        metadata
      } = req.body;

      if (!type || !title || !message || !severity) {
        return res.status(400).json({
          success: false,
          message: 'type, title, message, and severity are required'
        });
      }

      const result = await Alert.create({
        device_id,
        class_id,
        type,
        title,
        message,
        severity,
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: {
          id: result.insertId,
          device_id,
          class_id,
          type,
          title,
          message,
          severity
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async createDeviceEvent(req, res) {
    try {
      const payload = req.body || {};

      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Request body must be an object'
        });
      }

      const alertData = AlertController.buildDeviceEventAlert(payload);
      const result = await Alert.create(alertData);

      res.status(201).json({
        success: true,
        message: 'Device event stored as alert successfully',
        data: {
          id: result.insertId,
          ...alertData,
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { status, read_status, message } = req.body;

      const alertExists = await Alert.getById(id);
      if (!alertExists) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      await Alert.update(id, { status, read_status, message });

      res.json({
        success: true,
        message: 'Alert updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const alertExists = await Alert.getById(id);
      if (!alertExists) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      await Alert.markAsRead(id);

      res.json({
        success: true,
        message: 'Alert marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const { type, severity } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (severity) filters.severity = severity;

      await Alert.markAllAsRead(filters);

      res.json({
        success: true,
        message: 'All alerts marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const alertExists = await Alert.getById(id);
      if (!alertExists) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      await Alert.delete(id);

      res.json({
        success: true,
        message: 'Alert deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const count = await Alert.getUnreadCount();

      res.json({
        success: true,
        data: {
          unreadCount: count
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getSummary(req, res) {
    try {
      const summary = await Alert.getSummary();

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = AlertController;
