# Smart Energy Dashboard - Backend API

Backend API untuk Smart Energy Dashboard UNESA dengan teknologi Express.js dan MySQL.

## 📋 Prerequisites

- Node.js (v14 atau lebih tinggi)
- MySQL (v5.7 atau lebih tinggi)
- npm atau yarn

## 🚀 Installation

### 1. Setup Database

**Windows/Mac/Linux:**

```bash
# Buka MySQL client
mysql -u root -p

# Kemudian jalankan script database
source /Users/HCMPublic/Kuliah/Unesa\ Dashboard/backend/database/schema.sql
```

Atau gunakan MySQL Workbench untuk import file `database/schema.sql`

### 2. Install Dependencies

```bash
cd /Users/HCMPublic/Kuliah/Unesa\ Dashboard/backend
npm install
```

### 3. Configure Environment Variables

Edit file `.env` dengan konfigurasi database Anda:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_energy_dashboard
DB_PORT=3030
PORT=5000
NODE_ENV=development
```

### 4. Start the Server

**Development Mode (dengan auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### 1. **Classes (Ruangan/Kelas)**

#### Get All Classes
```http
GET /classes
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Kelas A",
      "description": "Ruang Kelas A",
      "location": "Gedung A",
      "building": "A",
      "floor": 3,
      "area": 45.5,
      "capacity": 30,
      "status": "active",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### Get Class by ID
```http
GET /classes/:id
```

#### Create Class
```http
POST /classes
Content-Type: application/json

{
  "name": "Kelas F",
  "description": "Ruang Kelas F",
  "location": "Gedung B",
  "building": "B",
  "floor": 2,
  "area": 50,
  "capacity": 35
}
```

#### Update Class
```http
PUT /classes/:id
Content-Type: application/json

{
  "name": "Kelas A",
  "description": "Updated description",
  "status": "active"
}
```

#### Delete Class
```http
DELETE /classes/:id
```

---

### 2. **Devices (Perangkat)**

#### Get All Devices
```http
GET /devices
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "class_id": 1,
      "class_name": "Kelas A",
      "name": "AC Unit",
      "type": "AC",
      "brand": "Daikin",
      "model": "FTC55",
      "power_rating": 3.0,
      "current_power": 2.8,
      "current_temperature": 22,
      "efficiency_rating": 91,
      "status": "active",
      "last_reading": "2024-01-15T10:30:00Z",
      "consumption": [
        {"hour": "00", "power": 2.5},
        {"hour": "06", "power": 2.8}
      ]
    }
  ]
}
```

#### Get Devices by Class
```http
GET /devices/class/:classId
```

#### Get Devices by Type
```http
GET /devices/type/AC
GET /devices/type/LAMP
```

#### Get Device by ID
```http
GET /devices/:id
```

#### Create Device
```http
POST /devices
Content-Type: application/json

{
  "class_id": 1,
  "name": "AC Unit",
  "type": "AC",
  "brand": "Daikin",
  "model": "FTC55",
  "power_rating": 3.0,
  "efficiency_rating": 91,
  "installation_date": "2023-01-01",
  "warranty_expiry": "2026-01-01",
  "notes": "Main AC for classroom"
}
```

#### Update Device
```http
PUT /devices/:id
Content-Type: application/json

{
  "name": "AC Unit - Updated",
  "current_power": 2.8,
  "current_temperature": 23,
  "efficiency_rating": 92,
  "status": "active"
}
```

#### Update Device Status
```http
PATCH /devices/:id/status
Content-Type: application/json

{
  "status": "active"
}
```

**Valid statuses:** `active`, `idle`, `offline`, `maintenance`

#### Update Device Reading
```http
PATCH /devices/:id/reading
Content-Type: application/json

{
  "power": 2.8,
  "temperature": 22.5
}
```

#### Delete Device
```http
DELETE /devices/:id
```

---

### 3. **Consumption Data (Data Konsumsi)**

#### Get Consumption by Device (Daily)
```http
GET /consumption/device/:deviceId?date=2024-01-15
```

#### Get Consumption by Class (Range)
```http
GET /consumption/class/:classId?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Daily Consumption
```http
GET /consumption/daily/:deviceId?date=2024-01-15
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour": "00:00",
      "power": 2.5,
      "temperature": 22,
      "humidity": 65
    },
    {
      "hour": "06:00",
      "power": 2.8,
      "temperature": 22.5,
      "humidity": 66
    }
  ]
}
```

#### Get Monthly Consumption
```http
GET /consumption/monthly/:deviceId?year=2024&month=1
```

#### Get Total Consumption by Class
```http
GET /consumption/total/class/:classId?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Hourly Aggregated Data
```http
GET /consumption/hourly/class/:classId?date=2024-01-15
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "time": "00:00",
      "ac": 15,
      "lamp": 8,
      "avg_temperature": 22.5
    }
  ]
}
```

#### Create Consumption Record
```http
POST /consumption
Content-Type: application/json

{
  "device_id": 1,
  "consumption": 2.8,
  "consumption_date": "2024-01-15",
  "hour_start": "10:00:00",
  "hour_end": "11:00:00",
  "temperature": 22.5,
  "humidity": 65,
  "notes": "Normal operation"
}
```

#### Bulk Insert Consumption Records
```http
POST /consumption/bulk
Content-Type: application/json

{
  "consumptionData": [
    {
      "device_id": 1,
      "consumption": 2.8,
      "consumption_date": "2024-01-15",
      "hour_start": "10:00:00",
      "hour_end": "11:00:00",
      "temperature": 22.5,
      "humidity": 65
    },
    {
      "device_id": 2,
      "consumption": 1.5,
      "consumption_date": "2024-01-15",
      "hour_start": "10:00:00",
      "hour_end": "11:00:00",
      "temperature": 35.0,
      "humidity": null
    }
  ]
}
```

---

### 4. **Alerts (Pemberitahuan)**

#### Get All Alerts
```http
GET /alerts
GET /alerts?type=warning
GET /alerts?severity=high
GET /alerts?status=active
GET /alerts?readStatus=false
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_id": 1,
      "class_id": 1,
      "type": "warning",
      "title": "High Power Consumption Detected",
      "message": "AC Unit consumption exceeded 3.0 kW threshold",
      "severity": "high",
      "status": "active",
      "read_status": false,
      "triggered_at": "2024-01-15T10:30:00Z",
      "resolved_at": null,
      "metadata": {},
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Alert by ID
```http
GET /alerts/:id
```

#### Get Alerts by Device
```http
GET /alerts/device/:deviceId
```

#### Get Alerts by Class
```http
GET /alerts/class/:classId
```

#### Get Unread Count
```http
GET /alerts/count/unread
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

#### Get Alert Summary
```http
GET /alerts/summary/stats
```

#### Create Alert
```http
POST /alerts
Content-Type: application/json

{
  "device_id": 1,
  "class_id": 1,
  "type": "warning",
  "title": "High Power Consumption",
  "message": "AC Unit consumption exceeded threshold",
  "severity": "high",
  "metadata": {
    "current_power": 3.2,
    "threshold": 3.0
  }
}
```

**Types:** `warning`, `error`, `success`, `info`
**Severity:** `low`, `medium`, `high`, `critical`

#### Update Alert
```http
PUT /alerts/:id
Content-Type: application/json

{
  "status": "resolved",
  "read_status": true,
  "message": "Alert resolved"
}
```

#### Mark Alert as Read
```http
PATCH /alerts/:id/read
```

#### Mark All Alerts as Read
```http
PATCH /alerts/read/all
PATCH /alerts/read/all?type=warning
PATCH /alerts/read/all?severity=high
```

#### Delete Alert
```http
DELETE /alerts/:id
```

---

### 5. **Settings (Pengaturan)**

#### Get All Settings
```http
GET /settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timezone": "Asia/Jakarta",
    "language": "id",
    "theme": "light",
    "consumption_alert_threshold": 15,
    "temperature_alert_threshold": 70,
    "data_retention_days": 90
  }
}
```

#### Get Setting by Key
```http
GET /settings/:key
```

**Example:**
```http
GET /settings/timezone
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "timezone",
    "value": "Asia/Jakarta",
    "dataType": "string",
    "description": "Default timezone"
  }
}
```

#### Set/Update Setting
```http
POST /settings
Content-Type: application/json

{
  "key": "consumption_alert_threshold",
  "value": "20",
  "dataType": "integer"
}
```

#### Get User Settings
```http
GET /settings/user/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "timezone": "Asia/Jakarta",
    "language": "id",
    "theme": "light",
    "email_notifications": true,
    "sms_notifications": false,
    "push_notifications": true,
    "alert_severity": "high",
    "consumption_threshold": 15,
    "temperature_threshold": 70,
    "cost_threshold": 50000,
    "two_factor": false,
    "session_timeout": 30,
    "auto_logout": true
  }
}
```

#### Update User Settings
```http
PUT /settings/user/:userId
Content-Type: application/json

{
  "timezone": "Asia/Jakarta",
  "language": "id",
  "theme": "dark",
  "email_notifications": true,
  "consumption_threshold": 20,
  "temperature_threshold": 75
}
```

#### Delete Setting
```http
DELETE /settings/:key
```

---

## 🔗 Integrasi dengan Frontend

### 1. Update API URL di Frontend

Di file frontend Next.js, tambahkan environment variable:

**`.env.local` di folder frontend:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 2. Buat API Service di Frontend

**`src/services/api.ts`:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = {
  // Classes
  getClasses: () => fetch(`${API_URL}/classes`).then(r => r.json()),
  
  // Devices
  getDevices: () => fetch(`${API_URL}/devices`).then(r => r.json()),
  getDevicesByClass: (classId: number) => 
    fetch(`${API_URL}/devices/class/${classId}`).then(r => r.json()),
  
  // Consumption
  getDailyConsumption: (deviceId: number, date: string) =>
    fetch(`${API_URL}/consumption/daily/${deviceId}?date=${date}`).then(r => r.json()),
  
  getHourlyConsumption: (classId: number, date: string) =>
    fetch(`${API_URL}/consumption/hourly/class/${classId}?date=${date}`).then(r => r.json()),
  
  // Alerts
  getAlerts: () => fetch(`${API_URL}/alerts`).then(r => r.json()),
  
  // Settings
  getSettings: () => fetch(`${API_URL}/settings`).then(r => r.json()),
  getUserSettings: (userId: number) =>
    fetch(`${API_URL}/settings/user/${userId}`).then(r => r.json()),
};
```

## 📊 Sample Data

Database sudah terisi dengan:
- 5 Kelas (Kelas A - E)
- 10 Devices (AC Unit dan Lighting untuk setiap kelas)
- Default settings untuk sistem

Untuk menambahkan consumption data, gunakan endpoint bulk insert atau generate secara real-time dari IoT devices.

## 🔍 Troubleshooting

### MySQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3030
```
**Solusi:**
- Pastikan MySQL server sudah running
- Cek konfigurasi database di `.env`
- Pastikan database `smart_energy_dashboard` sudah dibuat

### Port 5000 Already in Use
**Solusi:**
- Ubah PORT di `.env`
- Atau kill process yang menggunakan port 5000

### Module Not Found
**Solusi:**
```bash
npm install
```

## 📝 License

MIT License - Smart Energy Dashboard Backend

## 👨‍💻 Support

Untuk pertanyaan atau issues, silakan hubungi tim development.

---

**Backend API Version: 1.0.0**
