const Settings = require('../models/Settings');

class SettingsController {
  // Get all system settings
  static async getAll(req, res) {
    try {
      const settings = await Settings.getAll();

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get setting by key
  static async getByKey(req, res) {
    try {
      const { key } = req.params;
      const setting = await Settings.getByKey(key);

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found'
        });
      }

      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create or update setting (set)
  static async set(req, res) {
    try {
      const { key, value, dataType = 'string' } = req.body;

      if (!key || !value) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: key and value'
        });
      }

      const result = await Settings.set(key, value, dataType);

      res.json({
        success: true,
        message: 'Setting saved successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new setting
  static async create(req, res) {
    try {
      const { key, value, dataType = 'string' } = req.body;

      if (!key || !value) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: key and value'
        });
      }

      const result = await Settings.set(key, value, dataType);

      res.status(201).json({
        success: true,
        message: 'Setting created successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update setting
  static async update(req, res) {
    try {
      const { key } = req.params;
      const { value, dataType = 'string' } = req.body;

      if (!value) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: value'
        });
      }

      // Check if setting exists
      const existing = await Settings.getByKey(key);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found'
        });
      }

      const result = await Settings.set(key, value, dataType);

      res.json({
        success: true,
        message: 'Setting updated successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete setting
  static async delete(req, res) {
    try {
      const { key } = req.params;

      // Check if setting exists
      const existing = await Settings.getByKey(key);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found'
        });
      }

      const result = await Settings.delete(key);

      res.json({
        success: true,
        message: 'Setting deleted successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user settings
  static async getUserSettings(req, res) {
    try {
      const { userId } = req.params;
      const userSettings = await Settings.getUserSettings(userId);

      if (!userSettings) {
        return res.status(404).json({
          success: false,
          message: 'User settings not found'
        });
      }

      res.json({
        success: true,
        data: userSettings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update user settings
  static async updateUserSettings(req, res) {
    try {
      const { userId } = req.params;
      const settings = req.body;

      if (!settings || Object.keys(settings).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No settings provided'
        });
      }

      const result = await Settings.updateUserSettings(userId, settings);

      res.json({
        success: true,
        message: 'User settings updated successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = SettingsController;
