const Consumption = require('../models/Consumption');

class ConsumptionController {
  static async getByDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date query parameter is required (YYYY-MM-DD)'
        });
      }

      const consumption = await Consumption.getAllByDevice(deviceId, date);

      res.json({
        success: true,
        data: consumption
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
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate query parameters are required (YYYY-MM-DD)'
        });
      }

      const consumption = await Consumption.getByClass(classId, startDate, endDate);

      res.json({
        success: true,
        data: consumption
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getDaily(req, res) {
    try {
      const { deviceId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date query parameter is required (YYYY-MM-DD)'
        });
      }

      const consumption = await Consumption.getDaily(deviceId, date);
      
      // Transform to format expected by frontend
      const transformedData = consumption.map((item) => ({
        hour: item.hour_start.substring(0, 5),
        power: parseFloat(item.consumption),
        temperature: item.temperature,
        humidity: item.humidity
      }));

      res.json({
        success: true,
        data: transformedData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getMonthly(req, res) {
    try {
      const { deviceId } = req.params;
      let { year, month } = req.query;

      // If only month is provided in YYYY-MM format, extract year
      if (!year && month && month.includes('-')) {
        [year, month] = month.split('-');
      }

      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'year and month query parameters are required (or month in YYYY-MM format)'
        });
      }

      const consumption = await Consumption.getMonthly(deviceId, year, month);

      res.json({
        success: true,
        data: consumption
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getMonthlyTrend(req, res) {
    try {
      const { deviceId } = req.params;
      const { months = '6' } = req.query;

      const data = await Consumption.getMonthlyTrend(deviceId, months);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getMonthlyTrendSummary(req, res) {
    try {
      const { months = '6', classId } = req.query;
      const data = await Consumption.getMonthlyTrendSummary(months, classId || null);

      res.json({
        success: true,
        data
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
        id_class,
        class_code,
        classCode,
        occupancy,
        power_ac,
        power_ac_kw,
        power_lamp,
        power_lamp_kw,
        consumption,
        consumption_date,
        hour_start,
        hour_end,
        temperature,
        humidity,
        payload,
        message_id,
        notes
      } = req.body;

      if (device_id === undefined && id_class === undefined && class_code === undefined && classCode === undefined) {
        return res.status(400).json({
          success: false,
          message: 'device_id or id_class is required'
        });
      }

      const result = await Consumption.create({
        device_id,
        id_class,
        class_code: class_code ?? classCode,
        occupancy,
        power_ac: power_ac ?? power_ac_kw,
        power_lamp: power_lamp ?? power_lamp_kw,
        consumption,
        consumption_date,
        hour_start,
        hour_end,
        temperature,
        humidity,
        payload,
        message_id,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Consumption data created successfully',
        data: {
          id: result.insertId,
          device_id,
          id_class,
          class_code: class_code ?? classCode,
          occupancy,
          power_ac: power_ac ?? power_ac_kw,
          power_lamp: power_lamp ?? power_lamp_kw,
          consumption,
          consumption_date,
          hour_start,
          hour_end
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async bulkCreate(req, res) {
    try {
      const { consumptionData } = req.body;

      if (!Array.isArray(consumptionData) || consumptionData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'consumptionData array is required and must not be empty'
        });
      }

      const result = await Consumption.bulkInsert(consumptionData);

      res.status(201).json({
        success: true,
        message: 'Consumption data inserted successfully',
        data: {
          affectedRows: result.affectedRows,
          count: consumptionData.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getTotalByClass(req, res) {
    try {
      const { classId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate query parameters are required'
        });
      }

      const data = await Consumption.getTotalByClass(classId, startDate, endDate);

      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getHourlyAggregated(req, res) {
    try {
      const { classId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'date query parameter is required'
        });
      }

      const data = await Consumption.getHourlyAggregated(classId, date);

      // Transform to format expected by frontend
      const transformedData = {};
      data.forEach((item) => {
        if (!transformedData[item.hour_start]) {
          transformedData[item.hour_start] = { time: item.hour_start, ac: 0, lamp: 0, sensorTemp: 0, sensorHumidity: 0 };
        }

        if (item.ac_total !== undefined || item.lamp_total !== undefined) {
          transformedData[item.hour_start].ac = parseFloat(item.ac_total) || 0;
          transformedData[item.hour_start].lamp = parseFloat(item.lamp_total) || 0;
          transformedData[item.hour_start].sensorTemp = parseFloat(item.avg_temperature) || 0;
          transformedData[item.hour_start].sensorHumidity = parseFloat(item.avg_humidity) || 0;
          return;
        }

        if (item.device_type === 'AC') {
          transformedData[item.hour_start].ac = parseFloat(item.total_consumption) || 0;
        } else if (item.device_type === 'LAMP') {
          transformedData[item.hour_start].lamp = parseFloat(item.total_consumption) || 0;
        }
      });

      const result = Object.values(transformedData);

      res.json({
        success: true,
        data: result
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

      await Consumption.delete(id);

      res.json({
        success: true,
        message: 'Consumption data deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ConsumptionController;
