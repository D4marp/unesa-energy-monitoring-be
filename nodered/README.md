# Node-RED Setup untuk IoT Data Collection

## 📦 Files dalam folder ini:

- **Q1.01.02.json** - Original (IR Remote Control flow)
- **Q1.01.02-SENSOR-FLOW.json** ✨ (Energy Monitor - Data Collection)
- **Q1.01.03.json, Q1.01.04.json** - Untuk class lain
- **FLOW-DOCUMENTATION.md** - Dokumentasi lengkap
- **PAYLOAD-EXAMPLES.md** - Test cases dan device payload
- **README.md** - File ini

---

## 🚀 Quick Start

### Step 1: Install Node-RED
```bash
sudo npm install -g node-red
```

### Step 2: Start Node-RED
```bash
node-red
```
Accessible di `http://localhost:1880`

### Step 3: Deploy Flow
1. Import `Q1.01.02-SENSOR-FLOW.json` ke Node-RED
2. Configure MQTT broker
3. Deploy dan test

---

## 🔗 Data Flow

```
IoT Device (MQTT)
    ↓
[MQTT Input]
    ↓
[Parse & Validate]
    ↓
[Format for API]
    ↓
[HTTP POST to Backend]
    ↓
[Database]
```

---

## 📊 Setup Requirements

- Node.js & npm
- Node-RED
- MQTT Broker (Mosquitto)
- Backend API running (port 5000)
- MySQL database

---

## 🧪 Testing

```bash
mosquitto_pub -h localhost -t "sensor/q1.01.02/ac" -m '{
  "device_id": 1,
  "consumption": 2.5,
  "temperature": 24,
  "humidity": 65
}'
```

### Test payload 1T342MFX

Untuk test event access control, import file [1T342MFX-TEST.json](1T342MFX-TEST.json) lalu klik inject node **Send 1T342MFX Event**.

Endpoint backend yang dipakai flow ini:

`http://10.12.1.97:5000/api/v1/alerts/device-event`

### One-click test semua kelas

Import file [CLASS-TEST-SUITE.json](CLASS-TEST-SUITE.json) lalu klik inject node **Run All Class Tests**.
Flow ini akan mengirim payload test AC/Lamp untuk semua kelas secara berurutan ke endpoint:

`http://10.12.1.97:5000/api/v1/consumption`

### Monitor online/offline per ruangan

Status aktif/tidak aktif ditentukan dari data terakhir perangkat:

- sumber waktu: `last_reading` atau `last_heartbeat` dari API `/devices`
- rule: jika selisih waktu <= 5 menit -> `active`, jika lebih -> `offline`

Flow monitor dipisah per ruangan (tidak digabung):

- [DEVICE-MONITOR-Q1.01.02.json](DEVICE-MONITOR-Q1.01.02.json)
- [DEVICE-MONITOR-Q1.01.03.json](DEVICE-MONITOR-Q1.01.03.json)
- [DEVICE-MONITOR-Q1.01.04.json](DEVICE-MONITOR-Q1.01.04.json)
- [DEVICE-MONITOR-Q1.01.09.json](DEVICE-MONITOR-Q1.01.09.json)
- [DEVICE-MONITOR-Q1.01.11.json](DEVICE-MONITOR-Q1.01.11.json)

### Sinkron ON/OFF dari collector (real-time)

Flow [Q1.01.02-COLLECTOR.json](Q1.01.02-COLLECTOR.json) sudah disambungkan langsung ke backend untuk status ON/OFF:

- perintah AC ON (16-24 C) -> status device AC `active`
- perintah AC OFF -> status device AC `offline`
- perintah relay lamp open -> status device Lamp `active`
- perintah relay lamp close -> status device Lamp `offline`

Flow akan mencari device berdasarkan kombinasi `class_code` + `device_type`, lalu mengirim PATCH ke:

`http://10.12.1.97:5000/api/v1/devices/:id/status`

---

## 📚 Next Steps

1. Setup Node-RED
2. Import flow JSON
3. Configure MQTT connection
4. Register IoT devices in database
5. Test with MQTT messages
6. Monitor via debug nodes & database


