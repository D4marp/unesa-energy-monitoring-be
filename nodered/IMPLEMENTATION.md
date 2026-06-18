# Node-RED Data Collection Flows - Analisis & Implementasi

## 📊 Analisis Fisik Ruangan

```
CLASSROOM CODES & DEVICES:
├─ Q1.01.02 - Room 1
│  ├─ AC Unit
│  ├─ Lighting System
│  └─ Environmental Sensor
├─ Q1.01.03 - Room 2
│  ├─ AC Unit
│  ├─ Lighting System
│  └─ Environmental Sensor
├─ Q1.01.04 - Room 3
│  ├─ AC Unit
│  ├─ Lighting System
│  └─ Environmental Sensor
├─ Q1.01.07 - Room 4
│  ├─ AC Unit
│  ├─ Lighting System
│  └─ Environmental Sensor
└─ Q1.01.08 - Room 5
   ├─ AC Unit
   ├─ Lighting System
   └─ Environmental Sensor
```

---

## 🔄 Node-RED Flow Structure

Setiap classroom memiliki **INDEPENDENT COLLECTOR FLOW** yang:

### 1. **MQTT Input**
- Listen ke MQTT topic khusus untuk classroom
- Format: `sensor/[CLASSROOM_CODE]/[DEVICE_TYPE]`
- Contoh: `sensor/q1.01.02/ac`, `sensor/q1.01.02/lamp`

### 2. **Parse Function**
- Extract data dari MQTT payload
- Identify classroom code
- Format timestamp & hourly slots

### 3. **Validation**
- Check required fields (device_id, consumption)
- Validate data ranges:
  - Consumption: 0-100 kW
  - Temperature: -50 to 60°C
  - Humidity: 0-100%

### 4. **HTTP POST to API**
- Send formatted data ke backend API
- Endpoint: `http://localhost:5000/api/v1/consumption`
- Store di `device_consumption` table

### 5. **Response Check**
- Verify successful database insert
- Log errors if any

---

## 📁 File Structure

```
backend/nodered/
├─ Q1.01.02-COLLECTOR.json    ✨ New - Data collection for Q1.01.02
├─ Q1.01.03-COLLECTOR.json    ✨ New - Data collection for Q1.01.03
├─ Q1.01.04-COLLECTOR.json    ✨ New - Data collection for Q1.01.04
├─ Q1.01.07-COLLECTOR.json    ✨ New - Data collection for Q1.01.07
├─ Q1.01.08-COLLECTOR.json    ✨ New - Data collection for Q1.01.08
├─ Q1.01.02.json              📟 Original (IR Remote Control)
├─ Q1.01.03.json              📟 Original
├─ Q1.01.04.json              📟 Original
├─ README.md                   📖 Quick start guide
└─ IMPLEMENTATION.md           📖 Detailed implementation (this file)
```

---

## 🚀 Implementation Steps

### Step 1: Setup Node-RED
```bash
# Install globally
sudo npm install -g node-red

# Start Node-RED
node-red
# Access: http://localhost:1880
```

### Step 2: Import Collector Flows
For each classroom:
1. Open Node-RED: `http://localhost:1880`
2. Menu → Import → Paste JSON from `Q1.01.XX-COLLECTOR.json`
3. Deploy
4. Repeat for all 5 classrooms

### Step 3: Configure MQTT Broker
All collectors use same MQTT broker config:
- **Host:** localhost
- **Port:** 1883
- **Client ID:** nodered-collector
- **Protocol:** mqtt

If using different MQTT broker:
1. Edit MQTT node in any flow
2. Configure broker connection
3. Re-deploy

### Step 4: Setup IoT Devices
Devices must publish to correct MQTT topic:

**Q1.01.02 Devices:**
```
mosquitto_pub -h localhost -t "sensor/q1.01.02/ac" -m '{
  "device_id": 1,
  "power": 2.5,
  "temperature": 24.5,
  "humidity": 65.0
}'
```

**Q1.01.03 Devices:**
```
mosquitto_pub -h localhost -t "sensor/q1.01.03/ac" -m '{
  "device_id": 2,
  "power": 2.3,
  "temperature": 24.2,
  "humidity": 64.5
}'
```

Same pattern for Q1.01.04, Q1.01.07, Q1.01.08

### Step 5: Verify Data Flow
1. Check Node-RED Debug console → Should see parsed data
2. Check database:
```sql
SELECT * FROM device_consumption 
WHERE consumption_date = CURDATE() 
ORDER BY created_at DESC LIMIT 10;
```

---

## 🔌 MQTT Topic Mapping

Each classroom has its own MQTT topic space:

```
Topic: sensor/[CLASSROOM]/[DEVICE_TYPE]

CLASSROOM CODES:
├─ q1.01.02  → Room 1 (Device ID: 1)
├─ q1.01.03  → Room 2 (Device ID: 2)
├─ q1.01.04  → Room 3 (Device ID: 3)
├─ q1.01.07  → Room 4 (Device ID: 4)
└─ q1.01.08  → Room 5 (Device ID: 5)

DEVICE_TYPES:
├─ ac        → Air Conditioning
├─ lamp      → Lighting
├─ sensor    → Environmental (temp/humidity)
└─ +         → Wildcard (any device)

EXAMPLES:
- sensor/q1.01.02/ac      → AC in Q1.01.02
- sensor/q1.01.02/lamp    → Lighting in Q1.01.02
- sensor/q1.01.02/sensor  → Env sensor in Q1.01.02
- sensor/q1.01.02/+       → Any device in Q1.01.02
```

---

## 📦 Expected MQTT Payload Format

### Minimum Required
```json
{
  "device_id": 1,
  "consumption": 2.5
}
```

### Complete Format
```json
{
  "device_id": 1,
  "device_name": "AC Q1.01.02",
  "power": 2.5,
  "consumption": 2.5,
  "temperature": 24.5,
  "humidity": 65.3,
  "timestamp": "2026-04-01T10:30:00Z"
}
```

### Field Mapping
| MQTT Field | Mapped To | Description |
|-----------|-----------|-------------|
| device_id | device_id | Device identifier (required) |
| power | consumption | Power in kW (required) |
| consumption | consumption | Alternative to power |
| temperature | temperature | Room temp in °C |
| humidity | humidity | Room humidity % |

---

## 🧪 Testing Each Classroom

### Q1.01.02 Test
```bash
mosquitto_pub -h localhost -t "sensor/q1.01.02/ac" -m '{
  "device_id": 1,
  "power": 2.5,
  "temperature": 24,
  "humidity": 65
}'
```

### Q1.01.03 Test
```bash
mosquitto_pub -h localhost -t "sensor/q1.01.03/ac" -m '{
  "device_id": 2,
  "power": 2.3,
  "temperature": 23.8,
  "humidity": 64
}'
```

### Q1.01.04 Test
```bash
mosquitto_pub -h localhost -t "sensor/q1.01.04/ac" -m '{
  "device_id": 3,
  "power": 2.4,
  "temperature": 24.1,
  "humidity": 64.5
}'
```

### Q1.01.07 Test
```bash
mosquitto_pub -h localhost -t "sensor/q1.01.07/ac" -m '{
  "device_id": 4,
  "power": 2.2,
  "temperature": 23.5,
  "humidity": 63
}'
```

### Q1.01.08 Test
```bash
mosquitto_pub -h localhost -t "sensor/q1.01.08/ac" -m '{
  "device_id": 5,
  "power": 2.6,
  "temperature": 24.8,
  "humidity": 66
}'
```

---

## ✅ Verification Checklist

### Node-RED Level
- [ ] All 5 COLLECTOR flows imported & deployed
- [ ] MQTT broker connected (green status)
- [ ] Parse function receiving messages
- [ ] API response showing success

### Database Level
- [ ] Records appearing in device_consumption table
- [ ] Correct device_id for each classroom
- [ ] Timestamp data correct
- [ ] Temperature/humidity values valid

### API Level
- [ ] Backend running on port 5000
- [ ] POST /api/v1/consumption returning success
- [ ] No database connection errors

### Classroom Integration
- [ ] Each classroom has independent MQTT topic
- [ ] Data isolated per classroom
- [ ] No cross-contamination between rooms

---

## 📊 Database Queries

### Check data from each classroom
```sql
-- Q1.01.02 data
SELECT d.device_name, dc.consumption, dc.temperature, dc.created_at 
FROM devices d
JOIN device_consumption dc ON d.id = dc.device_id
WHERE d.device_eui LIKE '%Q1.01.02%'
ORDER BY dc.created_at DESC
LIMIT 5;
```

### Consumption by classroom (hourly)
```sql
SELECT 
  d.device_name,
  dc.consumption_date,
  dc.hour_start,
  AVG(dc.consumption) as avg_power,
  MAX(dc.temperature) as max_temp,
  MIN(dc.temperature) as min_temp
FROM devices d
JOIN device_consumption dc ON d.id = dc.device_id
WHERE dc.consumption_date = CURDATE()
GROUP BY d.id, dc.consumption_date, dc.hour_start
ORDER BY d.id, dc.hour_start;
```

### Daily summary per classroom
```sql
SELECT 
  d.device_name,
  DATE(dc.consumption_date) as date,
  COUNT(*) as readings,
  AVG(dc.consumption) as daily_avg_power,
  SUM(dc.consumption) as total_consumption,
  AVG(dc.temperature) as avg_temp,
  AVG(dc.humidity) as avg_humidity
FROM devices d
JOIN device_consumption dc ON d.id = dc.device_id
WHERE DATE(dc.consumption_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY d.id, DATE(dc.consumption_date)
ORDER BY d.id, DATE(dc.consumption_date) DESC;
```

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Flow not receiving data | MQTT topic incorrect | Verify topic matches: `sensor/q1.01.XX/+` |
| API returning 404 | Device not found | Register device in DB: `INSERT INTO devices...` |
| Validation failing | Data out of range | Check temperature 0-60°C, consumption 0-100 |
| Database insert failing | Backend not running | Start backend: `npm start` on port 5000 |
| MQTT connection error | Broker not running | Start Mosquitto: `mosquitto` or `brew services start mosquitto` |

---

## 🎯 Next Steps

1. **Import flows** for all 5 classrooms
2. **Configure MQTT** broker connection
3. **Register IoT devices** in database
4. **Test with MQTT** messages
5. **Monitor dashboard** for real-time data
6. **Setup alerts** for anomalies

---

## 📝 Notes

- Each collector is independent - can start/stop individually
- MQTT topic isolation ensures no data mixing
- Database automatically categorizes by device_id
- Frontend dashboard receives all data via API


