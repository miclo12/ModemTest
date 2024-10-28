
/*
const express = require('express');
const path = require('path');
const app = express();
const hostname = '127.0.0.1';
const port = 3000;
*/

// Serve static files from the 'public' directory
 //app.use(express.static(path.join(__dirname, 'public')));

// Route to send dummy sensor data
//app.get('/data', (req, res) => {
  //  const sensor1 = Math.floor(Math.random() * 100);  // Random value for sensor 1
    //const sensor2 = Math.floor(Math.random() * 100);  // Random value for sensor 2
    //res.json({ sensor1, sensor2 });
//});


//app.listen(port, hostname, () => {
  //  console.log(`Server running at http://${hostname}:${port}/`);
//});

// Variabler til at gemme sensorværdier
/*let sensor1 = 0;
let sensor2 = 0;

// Serverer statiske filer fra 'public' mappen
app.use(express.static(path.join(__dirname, 'public')));

// Modtag sensor-data fra modem via HTTP GET
app.get('/sensor-data', (req, res) => {
    sensor1 = req.query.sensor1 || sensor1;  // Brug den tidligere værdi, hvis ikke angivet
    sensor2 = req.query.sensor2 || sensor2;  // Brug den tidligere værdi, hvis ikke angivet
    console.log(`Modtagne sensorværdier - Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);
    res.send(`Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);
});

// Send sensor data til grafen
app.get('/data', (req, res) => {
    res.json({ sensor1, sensor2 });
});

// Start serveren
app.listen(port, hostname, () => {
    console.log(`Server kører på http://${hostname}:${port}/`);
}); */


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

