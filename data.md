CREATE TABLE model (model_id INT NOT NULL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT NOT NULL);
CREATE TABLE location (location_id INT NOT NULL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT NOT NULL);
CREATE TABLE sensor (sensor_id INT NOT NULL PRIMARY KEY, serial_number VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, location_id INT NOT NULL REFERENCES location(location_id), model_id INT NOT NULL REFERENCES model(model_id));
CREATE TABLE temperature_log (sensor_id INT NOT NULL, timestamp TIMESTAMPTZ NOT NULL, temp_c DECIMAL NOT NULL, temp_f DECIMAL NOT NULL, constraint temperature_log_fk FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id));
SELECT create_hypertable('temperature_log', by_range('timestamp', INTERVAL '1 day'));
