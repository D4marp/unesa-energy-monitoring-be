const db = require('../config/database');

class Device {
  static async getAll() {
    try {
      const [rows] = await db.query(`
        SELECT d.*, c.name as class_name 
        FROM devices d 
        LEFT JOIN classes c ON d.class_id = c.id 
        ORDER BY c.name, d.device_name
      `);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByClass(classId) {
    try {
      const [rows] = await db.query(`
        SELECT d.*, c.name as class_name 
        FROM devices d 
        LEFT JOIN classes c ON d.class_id = c.id 
        WHERE d.class_id = ? 
        ORDER BY d.device_name
      `, [classId]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByClassCode(classCode) {
    try {
      const [rows] = await db.query(`
        SELECT d.*, c.name as class_name 
        FROM devices d 
        LEFT JOIN classes c ON d.class_id = c.id 
        WHERE c.name = ? OR d.location = ?
        ORDER BY d.device_name
      `, [classCode, classCode]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.query(`
        SELECT d.*, c.name as class_name 
        FROM devices d 
        LEFT JOIN classes c ON d.class_id = c.id 
        WHERE d.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async create(data) {
    try {
      const {
        class_id, 
        name, 
        device_name,        // New IoT field
        type, 
        device_type,        // New IoT field
        brand, 
        model, 
        power_rating,
        efficiency_rating, 
        installation_date, 
        warranty_expiry, 
        notes,
        device_eui,         // New IoT field
        application_type,   // New IoT field
        location,           // New IoT field
        device_secret       // New IoT field
      } = data;

      // Use device_name if provided, fallback to name
      const finalName = device_name || name;
      // Use device_type if provided, fallback to type
      const finalType = device_type || type;

      const [result] = await db.query(`
        INSERT INTO devices 
        (class_id, device_name, device_type, brand, model, power_rating, efficiency_rating, installation_date, warranty_expiry, notes, device_eui, application_type, location, device_secret) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        class_id, 
        finalName, 
        finalType, 
        brand, 
        model, 
        power_rating, 
        efficiency_rating, 
        installation_date, 
        warranty_expiry, 
        notes,
        device_eui || null,
        application_type || null,
        location || null,
        device_secret || null
      ]);

      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async update(id, data) {
    try {
      const {
        class_id, 
        name,
        device_name,        // New IoT field
        type,
        device_type,        // New IoT field
        brand, 
        model, 
        power_rating,
        current_power, 
        current_temperature, 
        efficiency_rating, 
        status, 
        iot_status,         // New IoT field
        notes,
        location,           // New IoT field
        application_type    // New IoT field
      } = data;

      // Use device_name if provided, fallback to name
      const finalName = device_name || name;
      // Use device_type if provided, fallback to type
      const finalType = device_type || type;

      const [result] = await db.query(`
        UPDATE devices 
        SET class_id = ?, device_name = ?, device_type = ?, brand = ?, model = ?, power_rating = ?,
            current_power = ?, current_temperature = ?, efficiency_rating = ?, status = ?, iot_status = ?, notes = ?, location = ?, application_type = ?
        WHERE id = ?
      `, [
        class_id, 
        finalName, 
        finalType, 
        brand, 
        model, 
        power_rating, 
        current_power, 
        current_temperature, 
        efficiency_rating, 
        status, 
        iot_status || null,
        notes,
        location || null,
        application_type || null,
        id
      ]);

      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async updateStatus(id, status) {
    try {
      const iotStatus = status === 'active' || status === 'idle' ? 'active' : 'inactive';
      const [result] = await db.query(
        `UPDATE devices
         SET status = ?,
             iot_status = ?,
             last_heartbeat = CASE WHEN ? IN ('active', 'idle') THEN NOW() ELSE last_heartbeat END
         WHERE id = ?`,
        [status, iotStatus, status, id]
      );
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async updateReading(id, power, temperature) {
    try {
      const [result] = await db.query(`
        UPDATE devices 
        SET current_power = ?,
            current_temperature = ?,
            last_reading = NOW(),
            last_heartbeat = NOW(),
            status = 'active',
            iot_status = 'active'
        WHERE id = ?
      `, [power, temperature, id]);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM devices WHERE id = ?', [id]);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByType(type) {
    try {
      const [rows] = await db.query(`
        SELECT d.*, c.name as class_name 
        FROM devices d 
        LEFT JOIN classes c ON d.class_id = c.id 
        WHERE d.device_type = ? 
        ORDER BY c.name, d.device_name
      `, [type]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = Device;
