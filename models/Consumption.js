const db = require('../config/database');

class Consumption {
  static normalizeNumber(value) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  static normalizeClassId(value) {
    if (value === undefined || value === null) {
      return null;
    }

    const classValue = String(value).trim();
    if (!classValue) {
      return null;
    }

    return classValue.length > 2 ? classValue.slice(-2) : classValue.padStart(2, '0');
  }

  static normalizeTime(value, fallbackValue) {
    if (value === undefined || value === null || value === '') {
      return fallbackValue;
    }

    if (value instanceof Date) {
      return value.toTimeString().slice(0, 8);
    }

    const timeValue = String(value).trim();
    if (!timeValue) {
      return fallbackValue;
    }

    if (timeValue.length === 5) {
      return `${timeValue}:00`;
    }

    return timeValue.slice(0, 8);
  }

  static normalizeJson(value) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  static normalizeRow(data = {}) {
    const now = new Date();
    const fallbackDate = now.toISOString().split('T')[0];
    const fallbackStart = now.toTimeString().slice(0, 8);
    const fallbackEnd = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 8);

    const powerAc = Consumption.normalizeNumber(data.power_ac ?? data.power_ac_kw);
    const powerLamp = Consumption.normalizeNumber(data.power_lamp ?? data.power_lamp_kw);
    const providedConsumption = Consumption.normalizeNumber(data.consumption);
    const consumption = providedConsumption !== null
      ? providedConsumption
      : (powerAc || 0) + (powerLamp || 0);

    return {
      device_id: data.device_id ?? null,
      id_class: Consumption.normalizeClassId(data.id_class ?? data.class_code ?? data.classCode),
      occupancy: Consumption.normalizeNumber(data.occupancy),
      power_ac: powerAc,
      power_lamp: powerLamp,
      consumption,
      consumption_date: data.consumption_date || fallbackDate,
      hour_start: Consumption.normalizeTime(data.hour_start, fallbackStart),
      hour_end: Consumption.normalizeTime(data.hour_end, fallbackEnd),
      temperature: Consumption.normalizeNumber(data.temperature),
      humidity: Consumption.normalizeNumber(data.humidity),
      payload: Consumption.normalizeJson(data.payload ?? data.raw_payload),
      message_id: data.message_id ?? null,
      notes: data.notes ?? null,
    };
  }

  static async getAllByDevice(deviceId, date) {
    try {
      const [rows] = await db.query(`
        SELECT * FROM device_consumption 
        WHERE device_id = ? AND consumption_date = ? 
        ORDER BY hour_start
      `, [deviceId, date]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByClass(classId, startDate, endDate) {
    try {
      const [rows] = await db.query(`
        SELECT
          dc.*,
          d.id as device_id,
          d.device_name as device_name,
          d.device_type as device_type,
          COALESCE(c_device.id, c_class.id) as class_id,
          COALESCE(c_device.name, c_class.name) as class_name
        FROM device_consumption dc
        LEFT JOIN devices d ON dc.device_id = d.id
        LEFT JOIN classes c_device ON d.class_id = c_device.id
        LEFT JOIN classes c_class ON (c_class.id = CAST(dc.id_class AS UNSIGNED) OR RIGHT(c_class.name, 2) = dc.id_class)
        WHERE (c_device.id = ? OR c_class.id = ?) AND dc.consumption_date BETWEEN ? AND ?
        ORDER BY dc.consumption_date, dc.hour_start
      `, [classId, classId, startDate, endDate]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getDaily(deviceId, date) {
    try {
      const [rows] = await db.query(`
        SELECT 
          hour_start,
          consumption,
          temperature,
          humidity
        FROM device_consumption 
        WHERE device_id = ? AND consumption_date = ? 
        ORDER BY hour_start
      `, [deviceId, date]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getMonthly(deviceId, year, month) {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const [rows] = await db.query(`
        SELECT 
          DATE(consumption_date) as date,
          SUM(consumption) as total_consumption,
          AVG(temperature) as avg_temperature,
          MAX(consumption) as peak_consumption
        FROM device_consumption 
        WHERE device_id = ? AND consumption_date BETWEEN ? AND ?
        GROUP BY DATE(consumption_date)
        ORDER BY consumption_date
      `, [deviceId, startDate, endDate]);
      
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getMonthlyTrend(deviceId, months = 6) {
    try {
      const safeMonths = Math.max(1, Math.min(parseInt(months, 10) || 6, 24));
      const [rows] = await db.query(`
        SELECT
          DATE_FORMAT(consumption_date, '%Y-%m') as month_key,
          SUM(consumption) as total_consumption
        FROM device_consumption
        WHERE device_id = ?
          AND consumption_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ? - 1 MONTH)
          AND consumption_date < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
        GROUP BY DATE_FORMAT(consumption_date, '%Y-%m')
        ORDER BY month_key
      `, [deviceId, safeMonths]);

      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getMonthlyTrendSummary(months = 6, classId = null) {
    try {
      const safeMonths = Math.max(1, Math.min(parseInt(months, 10) || 6, 24));
      const queryParams = [safeMonths];
      let classFilter = '';

      if (classId !== null && classId !== undefined && classId !== '') {
        classFilter = ' AND (c_device.id = ? OR c_class.id = ?)';
        queryParams.push(classId, classId);
      }

      const [rows] = await db.query(`
        SELECT
          DATE_FORMAT(dc.consumption_date, '%Y-%m') as month_key,
          SUM(CASE
                WHEN dc.power_ac IS NOT NULL THEN dc.power_ac
                WHEN d.device_type = 'AC' THEN dc.consumption
                ELSE 0
              END) as ac_total,
          SUM(CASE
                WHEN dc.power_lamp IS NOT NULL THEN dc.power_lamp
                WHEN d.device_type = 'LAMP' THEN dc.consumption
                ELSE 0
              END) as lamp_total,
          AVG(dc.temperature) as avg_temperature,
          AVG(dc.humidity) as avg_humidity
        FROM device_consumption dc
        LEFT JOIN devices d ON d.id = dc.device_id
        LEFT JOIN classes c_device ON d.class_id = c_device.id
        LEFT JOIN classes c_class ON (c_class.id = CAST(dc.id_class AS UNSIGNED) OR RIGHT(c_class.name, 2) = dc.id_class)
        WHERE dc.consumption_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ? - 1 MONTH)
          AND dc.consumption_date < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
          ${classFilter}
        GROUP BY DATE_FORMAT(dc.consumption_date, '%Y-%m')
        ORDER BY month_key
      `, queryParams);

      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async create(data) {
    try {
      const row = Consumption.normalizeRow(data);
      
      const [result] = await db.query(`
        INSERT INTO device_consumption 
        (device_id, id_class, occupancy, power_ac, power_lamp, consumption, consumption_date, hour_start, hour_end, temperature, humidity, payload, message_id, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        id_class = VALUES(id_class),
        occupancy = VALUES(occupancy),
        power_ac = VALUES(power_ac),
        power_lamp = VALUES(power_lamp),
        consumption = VALUES(consumption),
        temperature = VALUES(temperature),
        humidity = VALUES(humidity),
        payload = VALUES(payload),
        message_id = VALUES(message_id),
        notes = VALUES(notes)
      `, [
        row.device_id,
        row.id_class,
        row.occupancy,
        row.power_ac,
        row.power_lamp,
        row.consumption,
        row.consumption_date,
        row.hour_start,
        row.hour_end,
        row.temperature,
        row.humidity,
        row.payload,
        row.message_id,
        row.notes,
      ]);
      
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async bulkInsert(consumptionData) {
    try {
      let query = `
        INSERT INTO device_consumption 
        (device_id, id_class, occupancy, power_ac, power_lamp, consumption, consumption_date, hour_start, hour_end, temperature, humidity, payload, message_id, notes) 
        VALUES 
      `;
      
      const values = [];
      const placeholders = [];

      consumptionData.forEach((data) => {
        const row = Consumption.normalizeRow(data);
        placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        values.push(
          row.device_id,
          row.id_class,
          row.occupancy,
          row.power_ac,
          row.power_lamp,
          row.consumption,
          row.consumption_date,
          row.hour_start,
          row.hour_end,
          row.temperature,
          row.humidity,
          row.payload,
          row.message_id,
          row.notes
        );
      });

      query += placeholders.join(', ');
      query += ` ON DUPLICATE KEY UPDATE
        id_class = VALUES(id_class),
        occupancy = VALUES(occupancy),
        power_ac = VALUES(power_ac),
        power_lamp = VALUES(power_lamp),
        consumption = VALUES(consumption),
        temperature = VALUES(temperature),
        humidity = VALUES(humidity),
        payload = VALUES(payload),
        message_id = VALUES(message_id),
        notes = VALUES(notes)`;

      const [result] = await db.query(query, values);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getTotalByClass(classId, startDate, endDate) {
    try {
      const [rows] = await db.query(`
        SELECT 
          COALESCE(d.id, CONCAT('class-', dc.id_class)) as id,
          COALESCE(d.device_name, CONCAT('Class ', COALESCE(c_class.name, dc.id_class))) as device_name,
          COALESCE(d.device_type, 'CLASS') as device_type,
          SUM(COALESCE(dc.consumption, COALESCE(dc.power_ac, 0) + COALESCE(dc.power_lamp, 0))) as total_consumption,
          AVG(COALESCE(dc.consumption, COALESCE(dc.power_ac, 0) + COALESCE(dc.power_lamp, 0))) as avg_consumption,
          MAX(COALESCE(dc.consumption, COALESCE(dc.power_ac, 0) + COALESCE(dc.power_lamp, 0))) as peak_consumption,
          COUNT(*) as readings_count
        FROM device_consumption dc
        LEFT JOIN devices d ON dc.device_id = d.id
        LEFT JOIN classes c_device ON d.class_id = c_device.id
        LEFT JOIN classes c_class ON (c_class.id = CAST(dc.id_class AS UNSIGNED) OR RIGHT(c_class.name, 2) = dc.id_class)
        WHERE (c_device.id = ? OR c_class.id = ?) AND dc.consumption_date BETWEEN ? AND ?
        GROUP BY COALESCE(d.id, CONCAT('class-', dc.id_class)), COALESCE(d.device_name, CONCAT('Class ', COALESCE(c_class.name, dc.id_class))), COALESCE(d.device_type, 'CLASS')
        ORDER BY total_consumption DESC
      `, [classId, classId, startDate, endDate]);
      
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getHourlyAggregated(classId, date) {
    try {
      const [rows] = await db.query(`
        SELECT 
          dc.hour_start,
          SUM(CASE
                WHEN dc.power_ac IS NOT NULL THEN dc.power_ac
                WHEN d.device_type = 'AC' THEN dc.consumption
                ELSE 0
              END) as ac_total,
          SUM(CASE
                WHEN dc.power_lamp IS NOT NULL THEN dc.power_lamp
                WHEN d.device_type = 'LAMP' THEN dc.consumption
                ELSE 0
              END) as lamp_total,
          AVG(dc.temperature) as avg_temperature,
          AVG(dc.humidity) as avg_humidity
        FROM device_consumption dc
        LEFT JOIN devices d ON dc.device_id = d.id
        LEFT JOIN classes c_device ON d.class_id = c_device.id
        LEFT JOIN classes c_class ON (c_class.id = CAST(dc.id_class AS UNSIGNED) OR RIGHT(c_class.name, 2) = dc.id_class)
        WHERE (c_device.id = ? OR c_class.id = ?) AND dc.consumption_date = ?
        GROUP BY dc.hour_start
        ORDER BY dc.hour_start
      `, [classId, classId, date]);
      
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM device_consumption WHERE id = ?', [id]);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = Consumption;
