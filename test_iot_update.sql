-- Simulate IoT Gateway class-level consumption insert
-- id_class uses the last two digits of the class name, e.g. Q1.01.02 -> 02
-- occupancy can be 0, 1, or NULL when the sensor does not provide it
-- power_ac and power_lamp are already in kW, temperature/humidity come from the sensor
INSERT INTO device_consumption (
    id_class,
    occupancy,
    power_ac,
    power_lamp,
    temperature,
    humidity
)
VALUES (
    '02',
    1,
    2.8000,
    0.4500,
    22.5000,
    65.0000
);

INSERT INTO device_consumption (
    id_class,
    occupancy,
    power_ac,
    power_lamp,
    temperature,
    humidity
)
VALUES (
    '03',
    NULL,
    3.1200,
    0.3800,
    24.2500,
    61.7500
);
