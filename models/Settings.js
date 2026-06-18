const db = require('../config/database');

class Settings {
  static async getAll() {
    try {
      const [rows] = await db.query('SELECT * FROM settings ORDER BY setting_key');
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByKey(key) {
    try {
      const [rows] = await db.query('SELECT * FROM settings WHERE setting_key = ?', [key]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async set(key, value, dataType = 'string') {
    try {
      const [result] = await db.query(`
        INSERT INTO settings (setting_key, setting_value, data_type)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value = ?, data_type = ?
      `, [key, value, dataType, value, dataType]);

      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getUserSettings(userId) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM user_settings WHERE user_id = ?',
        [userId]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async updateUserSettings(userId, settings) {
    try {
      const {
        timezone,
        language,
        theme,
        email_notifications,
        sms_notifications,
        push_notifications,
        alert_severity,
        consumption_threshold,
        temperature_threshold,
        cost_threshold,
        two_factor,
        session_timeout,
        auto_logout
      } = settings;

      const [result] = await db.query(`
        INSERT INTO user_settings (
          user_id, timezone, language, theme,
          email_notifications, sms_notifications, push_notifications,
          alert_severity, consumption_threshold, temperature_threshold,
          cost_threshold, two_factor, session_timeout, auto_logout
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          timezone = ?, language = ?, theme = ?,
          email_notifications = ?, sms_notifications = ?, push_notifications = ?,
          alert_severity = ?, consumption_threshold = ?, temperature_threshold = ?,
          cost_threshold = ?, two_factor = ?, session_timeout = ?, auto_logout = ?
      `, [
        userId, timezone, language, theme,
        email_notifications, sms_notifications, push_notifications,
        alert_severity, consumption_threshold, temperature_threshold,
        cost_threshold, two_factor, session_timeout, auto_logout,
        // Duplicate values for ON DUPLICATE KEY UPDATE
        timezone, language, theme,
        email_notifications, sms_notifications, push_notifications,
        alert_severity, consumption_threshold, temperature_threshold,
        cost_threshold, two_factor, session_timeout, auto_logout
      ]);

      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async delete(key) {
    try {
      const [result] = await db.query('DELETE FROM settings WHERE setting_key = ?', [key]);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = Settings;
