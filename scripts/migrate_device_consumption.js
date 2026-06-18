const db = require('../config/database');

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return Number(rows?.[0]?.count || 0) > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await db.query(
    `SELECT COUNT(DISTINCT INDEX_NAME) AS count
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [tableName, indexName]
  );

  return Number(rows?.[0]?.count || 0) > 0;
}

async function triggerExists(triggerName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.TRIGGERS
     WHERE TRIGGER_SCHEMA = DATABASE()
       AND TRIGGER_NAME = ?`,
    [triggerName]
  );

  return Number(rows?.[0]?.count || 0) > 0;
}

async function addColumnIfMissing(tableName, columnName, definition, afterColumn) {
  const exists = await columnExists(tableName, columnName);
  if (exists) {
    console.log(`Column already exists: ${tableName}.${columnName}`);
    return;
  }

  const afterClause = afterColumn ? ` AFTER ${afterColumn}` : '';
  await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}${afterClause}`);
  console.log(`Added column: ${tableName}.${columnName}`);
}

async function run() {
  const tableName = 'device_consumption';

  console.log('Checking live schema for device_consumption...');

  await addColumnIfMissing(tableName, 'id_class', "CHAR(2) NULL COMMENT 'Last two digits of class name, e.g. Q1.01.02 -> 02'", 'device_id');
  await addColumnIfMissing(tableName, 'occupancy', "TINYINT(1) NULL COMMENT '0/1 occupancy flag, nullable when unavailable'", 'id_class');
  await addColumnIfMissing(tableName, 'power_ac', "DECIMAL(10,4) DEFAULT NULL COMMENT 'AC power in kW'", 'occupancy');
  await addColumnIfMissing(tableName, 'power_lamp', "DECIMAL(10,4) DEFAULT NULL COMMENT 'Lamp power in kW'", 'power_ac');

  await db.query(`ALTER TABLE ${tableName} MODIFY device_id INT NULL`);
  await db.query(`ALTER TABLE ${tableName} MODIFY consumption DECIMAL(10,4) DEFAULT NULL COMMENT 'Total power consumption in kW'`);
  await db.query(`ALTER TABLE ${tableName} MODIFY temperature DECIMAL(10,4) DEFAULT NULL COMMENT 'Temperature from IoT sensor'`);
  await db.query(`ALTER TABLE ${tableName} MODIFY humidity DECIMAL(10,4) DEFAULT NULL COMMENT 'Humidity from IoT sensor'`);

  if (!(await indexExists(tableName, 'unique_consumption_class'))) {
    await db.query(`ALTER TABLE ${tableName} ADD UNIQUE KEY unique_consumption_class (id_class, consumption_date, hour_start)`);
    console.log('Added unique index: unique_consumption_class');
  } else {
    console.log('Unique index already exists: unique_consumption_class');
  }

  if (!(await indexExists(tableName, 'idx_class'))) {
    await db.query(`ALTER TABLE ${tableName} ADD INDEX idx_class (id_class)`);
    console.log('Added index: idx_class');
  } else {
    console.log('Index already exists: idx_class');
  }

  if (await triggerExists('trg_device_consumption_before_insert')) {
    await db.query('DROP TRIGGER trg_device_consumption_before_insert');
    console.log('Dropped existing trigger: trg_device_consumption_before_insert');
  }

  await db.query(`
    CREATE TRIGGER trg_device_consumption_before_insert
    BEFORE INSERT ON device_consumption
    FOR EACH ROW
    BEGIN
      IF NEW.id_class IS NOT NULL THEN
        SET NEW.id_class = LPAD(RIGHT(TRIM(NEW.id_class), 2), 2, '0');
      END IF;

      IF NEW.consumption IS NULL THEN
        SET NEW.consumption = COALESCE(NEW.power_ac, 0) + COALESCE(NEW.power_lamp, 0);
      END IF;

      IF NEW.consumption_date IS NULL THEN
        SET NEW.consumption_date = CURDATE();
      END IF;

      IF NEW.hour_start IS NULL THEN
        SET NEW.hour_start = TIME(NOW());
      END IF;

      IF NEW.hour_end IS NULL THEN
        SET NEW.hour_end = ADDTIME(NEW.hour_start, '01:00:00');
      END IF;
    END
  `);

  console.log('Created trigger: trg_device_consumption_before_insert');
  console.log('device_consumption migration completed successfully');
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });