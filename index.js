
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;  // Use environment variable or default to 3000

// Variables to store sensor values
let sensor1 = 0;
let sensor2 = 0;

// Serve static files from 'public' directory (like index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Receive sensor data from the modem via HTTP GET
app.get('/sensor-data', (req, res) => {
    sensor1 = parseFloat(req.query.sensor1) || sensor1;
    sensor2 = parseFloat(req.query.sensor2) || sensor2;
    console.log(`Updated sensor values - Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`); // Log for verification
    res.send(`Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);
});


// Send sensor data to the chart or graph in the client-side JavaScript


app.get('/data', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');  // Disable caching for this endpoint
    res.json({ sensor1, sensor2 });
});


// Start the server and listen on the defined port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

