const Device = require('../models/Device');
const Consumption = require('../models/Consumption');
const net = require('net');

// Mapping kelas ke port TCP In Node-RED LoRa Gateway
const CLASS_PORTS = {
  q10102: { className: "Q1.01.02", tcpPort: 5102 },
  q10103: { className: "Q1.01.03", tcpPort: 5103 },
  q10104: { className: "Q1.01.04", tcpPort: 5104 },
  q10109: { className: "Q1.01.09", tcpPort: 5109 },
  q10111: { className: "Q1.01.11", tcpPort: 5111 }
};

// Target hosts and ports for dynamic control of ac, lamp, and projector
const LAMP_GATEWAY_HOST = process.env.LAMP_GATEWAY_HOST || process.env.GATEWAY_HOST || "10.12.1.150";
const MINI_PC_NODE_RED_HOST = process.env.MINI_PC_NODE_RED_HOST || "127.0.0.1";

const TARGETS = {
  lamp: {
    label: "WS501/WS502 Lamp",
    host: LAMP_GATEWAY_HOST,
    ports: {
      q10102: 5102,
      q10103: 5103,
      q10104: 5104,
      q10109: 5109,
      q10111: 5111
    }
  },
  projector: {
    label: "Projector",
    host: MINI_PC_NODE_RED_HOST,
    ports: {
      q10102: 5102,
      q10103: 5103,
      q10104: 5104,
      q10109: 5109,
      q10111: 5111
    }
  },
  ac: {
    label: "AC",
    host: MINI_PC_NODE_RED_HOST,
    ports: {
      q10102: 5202,
      q10103: 5203,
      q10104: 5204,
      q10109: 5209,
      q10111: 5211
    }
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sendTcpOnce(host, port, payload) {
  const tcpTimeout = Number(process.env.TCP_TIMEOUT_MS || 3000);
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let finished = false;

    function cleanup() {
      client.removeAllListeners("timeout");
      client.removeAllListeners("error");
      client.removeAllListeners("close");
    }

    function finishOk() {
      if (!finished) {
        finished = true;
        cleanup();
        resolve();
      }
    }

    function finishError(err) {
      if (!finished) {
        finished = true;
        cleanup();
        try { client.destroy(); } catch (_) {}
        reject(err);
      }
    }

    client.setTimeout(tcpTimeout);

    client.connect(port, host, () => {
      // Node-RED TCP In memakai delimiter newline (\n)
      client.write(JSON.stringify(payload) + "\n", "utf8", (err) => {
        if (err) return finishError(err);
        client.end();
        finishOk();
      });
    });

    client.on("timeout", () => {
      finishError(new Error(`TCP timeout ke ${host}:${port}`));
    });

    client.on("error", (err) => {
      finishError(err);
    });
  });
}

async function sendTcpCommand(host, port, payload) {
  let lastError;
  const attempts = Math.max(1, Number(process.env.TCP_RETRY_ATTEMPTS || 1));
  const delay = Number(process.env.TCP_RETRY_DELAY_MS || 500);

  for (let i = 1; i <= attempts; i++) {
    try {
      await sendTcpOnce(host, port, payload);
      return { attempt: i };
    } catch (err) {
      lastError = err;
      if (i < attempts) await sleep(delay);
    }
  }

  throw lastError;
}

class DeviceController {
  // Maps classCode e.g. "Q1.01.02" → "http://10.12.1.150:1880/api/q10102"
  static getNodeRedClassEndpointUrl(classCode) {
    const baseUrl = (process.env.NODERED_BASE_URL || 'http://10.12.1.150:1880').replace(/\/$/, '');
    const endpoint = String(classCode).toLowerCase().replace(/\./g, '');
    return `${baseUrl}/api/${endpoint}`;
  }

  static async getAll(req, res) {
    try {
      const devices = await Device.getAll();

      // Attach latest consumption data for each device
      const devicesWithConsumption = await Promise.all(
        devices.map(async (device) => {
          const today = new Date().toISOString().split('T')[0];
          const consumptionData = await Consumption.getDaily(device.id, today);
          return {
            ...device,
            consumption: consumptionData
          };
        })
      );

      res.json({
        success: true,
        data: devicesWithConsumption
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
      const devices = await Device.getByClass(classId);

      // Attach latest consumption data for each device
      const devicesWithConsumption = await Promise.all(
        devices.map(async (device) => {
          const today = new Date().toISOString().split('T')[0];
          const consumptionData = await Consumption.getDaily(device.id, today);
          return {
            ...device,
            consumption: consumptionData
          };
        })
      );

      res.json({
        success: true,
        data: devicesWithConsumption
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getByClassCode(req, res) {
    try {
      const { classCode } = req.params;
      const devices = await Device.getByClassCode(classCode);

      const devicesWithConsumption = await Promise.all(
        devices.map(async (device) => {
          const today = new Date().toISOString().split('T')[0];
          const consumptionData = await Consumption.getDaily(device.id, today);
          return {
            ...device,
            consumption: consumptionData
          };
        })
      );

      res.json({
        success: true,
        data: devicesWithConsumption
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
      const device = await Device.getById(id);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Get consumption data
      const today = new Date().toISOString().split('T')[0];
      const consumptionData = await Consumption.getDaily(device.id, today);

      res.json({
        success: true,
        data: {
          ...device,
          consumption: consumptionData
        }
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
        location            // New IoT field
      } = req.body;

      // Validate required fields (support both old and new names)
      const finalName = device_name || name;
      const finalType = device_type || type;

      if (!class_id || !finalName || !finalType || !power_rating) {
        return res.status(400).json({
          success: false,
          message: 'class_id, name (or device_name), type (or device_type), and power_rating are required'
        });
      }

      const result = await Device.create({
        class_id,
        name: finalName,
        device_name: finalName,
        type: finalType,
        device_type: finalType,
        brand,
        model,
        power_rating,
        efficiency_rating,
        installation_date,
        warranty_expiry,
        notes,
        device_eui,
        application_type,
        location
      });

      res.status(201).json({
        success: true,
        message: 'Device created successfully',
        data: {
          id: result.insertId,
          class_id,
          device_name: finalName,
          device_type: finalType,
          device_eui: device_eui || null,
          application_type: application_type || null,
          location: location || null,
          brand,
          model,
          power_rating,
          efficiency_rating
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
      const data = req.body;

      const deviceExists = await Device.getById(id);
      if (!deviceExists) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      await Device.update(id, data);

      res.json({
        success: true,
        message: 'Device updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'idle', 'offline', 'maintenance'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: active, idle, offline, or maintenance'
        });
      }

      const deviceExists = await Device.getById(id);
      if (!deviceExists) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      await Device.updateStatus(id, status);

      res.json({
        success: true,
        message: 'Device status updated successfully',
        data: { id, status }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async controlViaNodeRed(req, res) {
    try {
      const { id } = req.params;
      const { action, state } = req.body;
      const finalAction = action || state;

      if (!finalAction || !['on', 'off'].includes(String(finalAction).toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be on or off'
        });
      }

      const device = await Device.getById(id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      const normalizedAction = String(finalAction).toLowerCase();
      const classCode = device.location || device.class_name || null;
      const classKey = classCode ? String(classCode).toLowerCase().replace(/\./g, '') : '';

      // Normalize device type
      let targetType = 'lamp';
      const devType = String(device.device_type || '').toLowerCase();
      if (devType.includes('ac')) {
        targetType = 'ac';
      } else if (devType.includes('projector') || devType.includes('proyektor')) {
        targetType = 'projector';
      } else if (devType.includes('lamp') || devType.includes('cahaya')) {
        targetType = 'lamp';
      }

      // Check if classroom is mapped in TARGETS for direct TCP control
      const target = TARGETS[targetType];
      if (target && classKey && target.ports[classKey]) {
        const tcpPort = target.ports[classKey];
        const host = target.host;
        const tcpPayload = {
          state: normalizedAction,
          device: targetType,
          classKey: classKey,
          source: "web_api"
        };

        try {
          const tcpResult = await sendTcpCommand(host, tcpPort, tcpPayload);
          const nextStatus = normalizedAction === 'on' ? 'active' : 'idle';
          await Device.updateStatus(id, nextStatus);

          return res.json({
            success: true,
            message: `${target.label} ${device.location || classCode} command ${normalizedAction.toUpperCase()} sent successfully via TCP`,
            data: {
              id: Number(id),
              action: normalizedAction,
              status: nextStatus,
              tcp: {
                device: targetType,
                className: device.location || classCode,
                host,
                port: tcpPort,
                tcpAttempt: tcpResult.attempt
              }
            }
          });
        } catch (err) {
          return res.status(500).json({
            success: false,
            message: `Gagal mengirim command TCP ke ${device.location || classCode} untuk ${target.label}`,
            error: err.message
          });
        }
      }

      // Fallback to original HTTP Node-RED endpoint
      const nodeRedUrl = classCode
        ? DeviceController.getNodeRedClassEndpointUrl(classCode)
        : null;

      if (!nodeRedUrl) {
        return res.status(400).json({
          success: false,
          message: 'Device has no class code — cannot determine Node-RED endpoint',
        });
      }

      const payload = { state: normalizedAction };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      let nodeRedResponse;
      try {
        nodeRedResponse = await fetch(nodeRedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      let nodeRedData = null;
      try {
        nodeRedData = await nodeRedResponse.json();
      } catch (e) {
        nodeRedData = null;
      }

      if (!nodeRedResponse.ok) {
        return res.status(502).json({
          success: false,
          message: 'Node-RED control request failed',
          upstreamStatus: nodeRedResponse.status,
          upstreamData: nodeRedData,
        });
      }

      const nextStatus = normalizedAction === 'on' ? 'active' : 'idle';
      await Device.updateStatus(id, nextStatus);

      return res.json({
        success: true,
        message: `Device ${normalizedAction.toUpperCase()} command sent successfully`,
        data: {
          id: Number(id),
          action: normalizedAction,
          status: nextStatus,
          nodeRed: nodeRedData,
        }
      });
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? 'Node-RED control request timed out'
        : error.message;

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  static async controlClassViaNodeRed(req, res) {
    try {
      const { classCode } = req.params;
      const { action, state } = req.body;
      const finalAction = action || state;

      if (!classCode) {
        return res.status(400).json({
          success: false,
          message: 'classCode is required'
        });
      }

      if (!finalAction || !['on', 'off'].includes(String(finalAction).toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be on or off'
        });
      }

      const devices = await Device.getByClassCode(classCode);
      if (!devices || devices.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No devices found for class ${classCode}`
        });
      }

      const normalizedAction = String(finalAction).toLowerCase();
      const classKey = String(classCode).toLowerCase().replace(/\./g, '');

      // Check if classroom is mapped in TARGETS for direct TCP control of all devices (lamp, projector, ac)
      const tcpPromises = [];
      for (const [targetKey, target] of Object.entries(TARGETS)) {
        const port = target.ports[classKey];
        if (port) {
          const tcpPayload = {
            state: normalizedAction,
            device: targetKey,
            classKey: classKey,
            source: "web_api"
          };
          tcpPromises.push(
            sendTcpCommand(target.host, port, tcpPayload)
              .then(res => ({ success: true, device: targetKey, attempt: res.attempt }))
              .catch(err => ({ success: false, device: targetKey, error: err.message }))
          );
        }
      }

      if (tcpPromises.length > 0) {
        try {
          const results = await Promise.all(tcpPromises);
          const nextStatus = normalizedAction === 'on' ? 'active' : 'idle';
          await Promise.all(devices.map((device) => {
            if (device.device_type !== 'SENSOR') {
              return Device.updateStatus(device.id, nextStatus);
            }
            return Promise.resolve();
          }));

          const failures = results.filter(r => !r.success);
          if (failures.length === tcpPromises.length) {
            return res.status(500).json({
              success: false,
              message: `Gagal mengirim command TCP ke semua perangkat di kelas ${classCode}`,
              errors: failures
            });
          }

          return res.json({
            success: true,
            message: `Class ${classCode} ${normalizedAction.toUpperCase()} command sent to devices via TCP`,
            data: {
              classCode,
              action: normalizedAction,
              status: nextStatus,
              affectedDevices: devices.length,
              results
            }
          });
        } catch (err) {
          return res.status(500).json({
            success: false,
            message: `Gagal mengontrol perangkat kelas ${classCode}`,
            error: err.message
          });
        }
      }

      // Fallback to original HTTP Node-RED endpoint
      const nodeRedUrl = DeviceController.getNodeRedClassEndpointUrl(classCode);

      const payload = { state: normalizedAction };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      let nodeRedResponse;
      try {
        nodeRedResponse = await fetch(nodeRedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      let nodeRedData = null;
      try {
        nodeRedData = await nodeRedResponse.json();
      } catch (e) {
        nodeRedData = null;
      }

      if (!nodeRedResponse.ok) {
        return res.status(502).json({
          success: false,
          message: 'Node-RED class control request failed',
          upstreamStatus: nodeRedResponse.status,
          upstreamData: nodeRedData,
        });
      }

      const nextStatus = normalizedAction === 'on' ? 'active' : 'idle';
      await Promise.all(devices.map((device) => {
        if (device.device_type !== 'SENSOR') {
          return Device.updateStatus(device.id, nextStatus);
        }
        return Promise.resolve();
      }));

      return res.json({
        success: true,
        message: `Class ${classCode} ${normalizedAction.toUpperCase()} command sent successfully`,
        data: {
          classCode,
          action: normalizedAction,
          status: nextStatus,
          affectedDevices: devices.length,
          nodeRed: nodeRedData,
        }
      });
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? 'Node-RED class control request timed out'
        : error.message;

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  static async updateReading(req, res) {
    try {
      const { id } = req.params;
      const { power, temperature } = req.body;

      if (power === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Power reading is required'
        });
      }

      const deviceExists = await Device.getById(id);
      if (!deviceExists) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      await Device.updateReading(id, power, temperature);

      res.json({
        success: true,
        message: 'Device reading updated successfully'
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

      const deviceExists = await Device.getById(id);
      if (!deviceExists) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      await Device.delete(id);

      res.json({
        success: true,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getByType(req, res) {
    try {
      const { type } = req.params;
      const devices = await Device.getByType(type);

      res.json({
        success: true,
        data: devices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = DeviceController;
