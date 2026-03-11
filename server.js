const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('./temperature.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the temperature database.');
    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS temperature_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Temperature readings table is ready.');
      }
    });
  }
});

// API endpoint for Arduino to POST temperature data
app.post('/api/temperature', (req, res) => {
  const { temperature } = req.body;
  
  if (temperature === undefined || temperature === null) {
    return res.status(400).json({ error: 'Temperature value is required' });
  }

  const sql = 'INSERT INTO temperature_readings (temperature) VALUES (?)';
  
  db.run(sql, [temperature], function(err) {
    if (err) {
      console.error('Error inserting data:', err.message);
      return res.status(500).json({ error: 'Failed to save temperature data' });
    }
    
    res.status(201).json({
      message: 'Temperature data saved successfully',
      id: this.lastID,
      temperature: temperature
    });
  });
});

// API endpoint to GET temperature data for frontend
app.get('/api/temperature', (req, res) => {
  const limit = req.query.limit || 100; // Default to last 100 readings
  
  const sql = `SELECT id, temperature, datetime(timestamp, 'localtime') as timestamp 
               FROM temperature_readings 
               ORDER BY timestamp DESC 
               LIMIT ?`;
  
  db.all(sql, [limit], (err, rows) => {
    if (err) {
      console.error('Error fetching data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch temperature data' });
    }
    
    // Reverse to get chronological order for graphing
    res.json(rows.reverse());
  });
});

// API endpoint to get statistics
app.get('/api/temperature/stats', (req, res) => {
  const sql = `SELECT 
                 COUNT(*) as count,
                 AVG(temperature) as average,
                 MIN(temperature) as minimum,
                 MAX(temperature) as maximum
               FROM temperature_readings`;
  
  db.get(sql, [], (err, row) => {
    if (err) {
      console.error('Error fetching stats:', err.message);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
    
    res.json(row);
  });
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Arduino can POST to: http://localhost:${PORT}/api/temperature`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
