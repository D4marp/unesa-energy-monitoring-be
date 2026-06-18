const db = require('../config/database');

class Alert {
  static async getAll(filters = {}) {
    try {
      let query = 'SELECT * FROM alerts WHERE 1=1';
      const values = [];

      if (filters.type) {
        query += ' AND type = ?';
        values.push(filters.type);
      }

      if (filters.severity) {
        query += ' AND severity = ?';
        values.push(filters.severity);
      }

      if (filters.status) {
        query += ' AND status = ?';
        values.push(filters.status);
      }

      if (filters.readStatus !== undefined) {
        query += ' AND read_status = ?';
        values.push(filters.readStatus);
      }

      query += ' ORDER BY created_at DESC LIMIT 100';

      const [rows] = await db.query(query, values);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.query('SELECT * FROM alerts WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByDevice(deviceId) {
    try {
      const [rows] = await db.query(`
        SELECT * FROM alerts 
        WHERE device_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
      `, [deviceId]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByClass(classId) {
    try {
      const [rows] = await db.query(`
        SELECT * FROM alerts 
        WHERE class_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
      `, [classId]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async create(data) {
    try {
      const {
        device_id,
        class_id,
        type,
        title,
        message,
        severity,
        metadata
      } = data;

      const [result] = await db.query(`
        INSERT INTO alerts 
        (device_id, class_id, type, title, message, severity, metadata) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [device_id, class_id, type, title, message, severity, JSON.stringify(metadata || {})]);

      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async update(id, data) {
    try {
      const { status, read_status, message } = data;
      const updateData = {};
      const values = [];

      if (status) {
        updateData.status = '?';
        values.push(status);
      }

      if (read_status !== undefined) {
        updateData.read_status = '?';
        values.push(read_status);
      }

      if (message) {
        updateData.message = '?';
        values.push(message);
      }

      if (status === 'resolved') {
        updateData.resolved_at = 'NOW()';
      }

      values.push(id);

      const setClause = Object.entries(updateData)
        .map(([key, val]) => `${key} = ${val}`)
        .join(', ');

      const [result] = await db.query(
        `UPDATE alerts SET ${setClause} WHERE id = ?`,
        values
      );

      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async markAsRead(id) {
    try {
      const [result] = await db.query(
        'UPDATE alerts SET read_status = TRUE WHERE id = ?',
        [id]
      );
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async markAllAsRead(filters = {}) {
    try {
      let query = 'UPDATE alerts SET read_status = TRUE WHERE 1=1';
      const values = [];

      if (filters.type) {
        query += ' AND type = ?';
        values.push(filters.type);
      }

      if (filters.severity) {
        query += ' AND severity = ?';
        values.push(filters.severity);
      }

      const [result] = await db.query(query, values);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM alerts WHERE id = ?', [id]);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getUnreadCount() {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM alerts WHERE read_status = FALSE'
      );
      return rows[0].count;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getSummary() {
    try {
      const [rows] = await db.query(`
        SELECT 
          type,
          severity,
          status,
          COUNT(*) as count
        FROM alerts
        GROUP BY type, severity, status
      `);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = Alert;
