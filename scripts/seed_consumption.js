const db = require('../config/database');

async function seed() {
  console.log('🌱 Starting database seeding for device consumption...');
  
  // 1. Get all devices with their classes
  const [devices] = await db.query('SELECT * FROM devices');
  console.log(`Found ${devices.length} devices in the database.`);
  
  // Clean up existing consumption records
  console.log('Cleaning up existing device_consumption records...');
  await db.query('DELETE FROM device_consumption');
  
  const insertData = [];
  const now = new Date();
  
  // 2. Generate 30 days of hourly data
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - dayOffset);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // Check if weekend (school load is lower)
    const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStartStr = `${String(hour).padStart(2, '0')}:00:00`;
      const hourEndStr = `${String((hour + 1) % 24).padStart(2, '0')}:00:00`;
      
      // Determine activity factors based on hour of the day
      let activeProbability = 0;
      let powerFactor = 1;
      
      if (hour >= 8 && hour <= 17) {
        // Business hours
        activeProbability = isWeekend ? 0.15 : 0.85;
        powerFactor = 0.8 + Math.random() * 0.4; // 80% to 120% load
      } else if ((hour >= 7 && hour < 8) || (hour > 17 && hour <= 21)) {
        // Shoulder hours
        activeProbability = isWeekend ? 0.05 : 0.4;
        powerFactor = 0.5 + Math.random() * 0.3;
      } else {
        // Night hours
        activeProbability = 0.02;
        powerFactor = 0.2;
      }
      
      // Base temperature depending on hour
      let ambientTemp = 28 + Math.sin((hour - 13) * Math.PI / 12) * 3; // peak around 1 PM
      let ambientHumidity = 75 - Math.sin((hour - 13) * Math.PI / 12) * 15;
      
      for (const device of devices) {
        const isDeviceAc = device.device_type === 'AC';
        const isDeviceLamp = device.device_type === 'LAMP';
        const isDeviceSensor = device.device_type === 'SENSOR';
        
        if (!isDeviceAc && !isDeviceLamp && !isDeviceSensor) {
          continue; // skip other devices like projectors
        }
        
        let powerAc = null;
        let powerLamp = null;
        let consumption = null;
        let temperature = null;
        let humidity = null;
        
        const isActive = Math.random() < activeProbability;
        const powerRating = parseFloat(device.power_rating) || 1.0;
        
        if (isDeviceAc) {
          if (isActive) {
            powerAc = Number((powerRating * powerFactor).toFixed(4));
            consumption = powerAc;
          } else {
            powerAc = 0.0;
            consumption = 0.0;
          }
        } else if (isDeviceLamp) {
          if (isActive) {
            powerLamp = Number((powerRating * powerFactor * 0.7).toFixed(4)); // lamps rarely run at full 100% capacity
            consumption = powerLamp;
          } else {
            powerLamp = 0.0;
            consumption = 0.0;
          }
        } else if (isDeviceSensor) {
          // Check if AC is active in this class at this hour
          const acInSameClass = devices.find(d => d.class_id === device.class_id && d.device_type === 'AC');
          const isAcActive = acInSameClass && Math.random() < activeProbability; // rough check
          
          if (isAcActive) {
            temperature = Number((22 + Math.random() * 2).toFixed(2)); // nice and cool AC temp
            humidity = Number((60 + Math.random() * 8).toFixed(2));
          } else {
            temperature = Number((ambientTemp + (Math.random() - 0.5) * 1.5).toFixed(2));
            humidity = Number((ambientHumidity + (Math.random() - 0.5) * 5).toFixed(2));
          }
        }
        
        insertData.push([
          device.id,
          null, // id_class is NULL for device-level records to avoid index collisions
          isActive ? 1 : 0,
          powerAc,
          powerLamp,
          consumption,
          dateStr,
          hourStartStr,
          hourEndStr,
          temperature,
          humidity,
          JSON.stringify({ simulated: true }),
          `msg-sim-${device.id}-${dateStr}-${hour}`
        ]);
      }
    }
  }
  
  console.log(`Generated ${insertData.length} records. Bulk inserting in chunks...`);
  
  const chunkSize = 500;
  for (let i = 0; i < insertData.length; i += chunkSize) {
    const chunk = insertData.slice(i, i + chunkSize);
    
    // Construct bulk query
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = chunk.flat();
    
    await db.query(`
      INSERT INTO device_consumption (
        device_id, id_class, occupancy, power_ac, power_lamp, consumption, 
        consumption_date, hour_start, hour_end, temperature, humidity, payload, message_id
      ) VALUES ${placeholders}
    `, values);
    
    console.log(`Inserted chunk ${i / chunkSize + 1} / ${Math.ceil(insertData.length / chunkSize)}`);
  }
  
  // Also let's update some status and current_power readings on the devices table for live view
  console.log('Updating current readings on devices table for active view...');
  for (const device of devices) {
    let currentPower = 0.00;
    let currentTemp = null;
    let status = 'offline';
    
    if (device.device_type === 'AC') {
      const active = Math.random() < 0.6;
      currentPower = active ? Number((parseFloat(device.power_rating) * (0.8 + Math.random() * 0.3)).toFixed(2)) : 0.00;
      currentTemp = active ? Number((22 + Math.random() * 2).toFixed(1)) : null;
      status = active ? 'active' : 'idle';
    } else if (device.device_type === 'LAMP') {
      const active = Math.random() < 0.7;
      currentPower = active ? Number((parseFloat(device.power_rating) * 0.8).toFixed(2)) : 0.00;
      status = active ? 'active' : 'idle';
    } else if (device.device_type === 'SENSOR') {
      currentPower = 0.05;
      currentTemp = Number((26 + Math.random() * 3).toFixed(1));
      status = 'active';
    } else if (device.device_type === 'PROJECTOR') {
      const active = Math.random() < 0.3;
      currentPower = active ? 0.35 : 0.00;
      status = active ? 'active' : 'idle';
    }
    
    await db.query(
      'UPDATE devices SET current_power = ?, current_temperature = ?, status = ?, last_reading = NOW(), last_heartbeat = NOW() WHERE id = ?',
      [currentPower, currentTemp, status, device.id]
    );
  }
  
  console.log('✅ Seeding completed successfully!');
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
