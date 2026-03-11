# Arduino Temperature Monitor

A full-stack application for monitoring temperature data from an Arduino device. Features a REST API endpoint for data collection, SQLite database for persistence, and a real-time web dashboard with interactive graphs.

## Features

- 📊 Real-time temperature graph visualization
- 🔌 REST API endpoint for Arduino to POST temperature data
- 💾 SQLite database for data persistence
- 📈 Live statistics (current, average, min, max temperatures)
- 🔄 Auto-refresh every 5 seconds
- 📱 Responsive design for mobile and desktop

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Arduino board (optional, for actual hardware integration)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

3. Open your browser and navigate to:

```
http://localhost:3000
```

## API Endpoints

### POST /api/temperature

Submit a new temperature reading.

**Request Body:**

```json
{
  "temperature": 23.5
}
```

**Response:**

```json
{
  "message": "Temperature data saved successfully",
  "id": 1,
  "temperature": 23.5
}
```

### GET /api/temperature

Retrieve temperature readings.

**Query Parameters:**

- `limit` (optional): Number of readings to return (default: 100)

**Response:**

```json
[
  {
    "id": 1,
    "temperature": 23.5,
    "timestamp": "2026-03-11 14:30:00"
  }
]
```

### GET /api/temperature/stats

Get temperature statistics.

**Response:**

```json
{
  "count": 150,
  "average": 23.4,
  "minimum": 18.2,
  "maximum": 28.9
}
```

## Arduino Integration

### Required Libraries

- WiFi (for WiFi-enabled boards like ESP8266/ESP32)
- HTTPClient (for making HTTP requests)
- DHT sensor library (if using DHT11/DHT22 temperature sensors)

### Example Arduino Code (ESP8266/ESP32)

```cpp
#include <ESP8266WiFi.h>  // For ESP8266
// OR
// #include <WiFi.h>  // For ESP32

#include <ESP8266HTTPClient.h>  // For ESP8266
// OR
// #include <HTTPClient.h>  // For ESP32

#include <WiFiClient.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/temperature";

// DHT Sensor setup
#define DHTPIN D4     // Pin connected to DHT sensor
#define DHTTYPE DHT22 // DHT 22 (AM2302)
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Wait between measurements
  delay(10000); // Send data every 10 seconds

  // Read temperature
  float temperature = dht.readTemperature();

  // Check if reading failed
  if (isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");

  // Send data to server
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    String jsonPayload = "{\"temperature\":" + String(temperature) + "}";

    // Send POST request
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      Serial.println("Response: " + response);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }
}
```

### Alternative: Arduino Ethernet Shield

```cpp
#include <SPI.h>
#include <Ethernet.h>
#include <DHT.h>

// MAC address for Ethernet shield
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };

// Server details
char server[] = "YOUR_SERVER_IP";
int port = 3000;

EthernetClient client;

// DHT Sensor setup
#define DHTPIN 2
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();

  // Start Ethernet connection
  if (Ethernet.begin(mac) == 0) {
    Serial.println("Failed to configure Ethernet using DHCP");
    return;
  }

  Serial.print("IP address: ");
  Serial.println(Ethernet.localIP());

  delay(1000);
}

void loop() {
  delay(10000); // Send data every 10 seconds

  float temperature = dht.readTemperature();

  if (isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: ");
  Serial.println(temperature);

  if (client.connect(server, port)) {
    Serial.println("Connected to server");

    // Create JSON payload
    String jsonPayload = "{\"temperature\":" + String(temperature) + "}";

    // Send HTTP POST request
    client.println("POST /api/temperature HTTP/1.1");
    client.print("Host: ");
    client.println(server);
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(jsonPayload.length());
    client.println("Connection: close");
    client.println();
    client.println(jsonPayload);

    delay(100);

    // Read response
    while (client.available()) {
      char c = client.read();
      Serial.write(c);
    }

    client.stop();
    Serial.println();
    Serial.println("Disconnected");
  } else {
    Serial.println("Connection failed");
  }
}
```

## Testing Without Arduino

You can test the API using curl or any HTTP client:

```bash
# Send a temperature reading
curl -X POST http://localhost:3000/api/temperature \
  -H "Content-Type: application/json" \
  -d '{"temperature": 23.5}'

# Get temperature data
curl http://localhost:3000/api/temperature?limit=10

# Get statistics
curl http://localhost:3000/api/temperature/stats
```

Or use PowerShell on Windows:

```powershell
# Send a temperature reading
Invoke-RestMethod -Uri http://localhost:3000/api/temperature -Method Post -Body '{"temperature": 23.5}' -ContentType "application/json"

# Get temperature data
Invoke-RestMethod -Uri http://localhost:3000/api/temperature?limit=10

# Get statistics
Invoke-RestMethod -Uri http://localhost:3000/api/temperature/stats
```

## Project Structure

```
temp-app/
├── server.js           # Express server with API endpoints
├── package.json        # Node.js dependencies
├── temperature.db      # SQLite database (auto-generated)
├── public/
│   └── index.html      # Frontend dashboard
└── README.md           # This file
```

## Database Schema

The SQLite database contains a single table:

```sql
CREATE TABLE temperature_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  temperature REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Configuration

You can customize the following settings:

- **Port**: Change `PORT` environment variable (default: 3000)
- **Database location**: Modify database path in `server.js`
- **Auto-refresh interval**: Adjust interval in `public/index.html` (default: 5000ms)
- **Default data limit**: Change in `server.js` (default: 100 readings)

## Troubleshooting

### Arduino can't connect to server

- Ensure the Arduino and server are on the same network
- Use the server's local IP address, not `localhost`
- Check firewall settings on the server machine
- Verify the port (3000) is not blocked

### No data showing on dashboard

- Check if the server is running
- Open browser console (F12) to check for errors
- Verify the database file was created (`temperature.db`)
- Try sending a test request using curl/PowerShell

### Database errors

- Delete `temperature.db` and restart the server to recreate it
- Check file permissions on the database file

## License

ISC

## Contributing

Feel free to submit issues and enhancement requests!
