
/*const express = require('express');
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
*/



/// DATABASE DELEN.

/*
require('dotenv').config();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

// Initialize Supabase
const supabaseUrl = 'https://pncxmgwqajdxbubxxgyl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Route to add sensor data
app.get('/add-sensor-data', async (req, res) => {
  const { sensorId, temperature } = req.query;

  if (!sensorId || !temperature) {
    return res.status(400).send("Please provide both sensorId and temperature.");
  }

  const { data, error } = await supabase
    .from('Sensor_data')
    .insert([{ sensor_Id: sensorId, temperature: parseFloat(temperature) }]);

  if (error) {
    console.error('Error adding data:', error);
    res.status(500).send('Failed to add data.');
  } else {
    res.send(`Added data for ${sensorId}: ${temperature}°C`);
  }
});

// Route to retrieve sensor data for a specific sensor
app.get('/get-sensor-data', async (req, res) => {
  const { sensorId } = req.query;

  // Check that sensorId is provided
  if (!sensorId) {
    return res.status(400).send("Please provide a sensorId.");
  }

  // Fetch data from Supabase for the specific sensor
  const { data, error } = await supabase
    .from('Sensor_data')
    .select('*')
    .eq('sensor_Id', sensorId) // Updated to match the correct column name
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Failed to retrieve data.');
  } else {
    res.json(data);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
*/

require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = 'https://pncxmgwqajdxbubxxgyl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Serve static files from 'public' directory (like index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Variables to store the latest sensor values
let sensor1 = 0;
let sensor2 = 0;

// Route to receive sensor data from the modem
app.get('/sensor-data', async (req, res) => {
    sensor1 = parseFloat(req.query.sensor1) || sensor1;
    sensor2 = parseFloat(req.query.sensor2) || sensor2;
    
    console.log(`Updated sensor values - Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);

    // Store sensor values in Supabase
    const { data, error } = await supabase
      .from('Sensor_data') // Make sure this matches your table name
      .insert([
          { sensor_Id: 'sensor_1', temperature: sensor1 },
          { sensor_Id: 'sensor_2', temperature: sensor2 }
      ]);

    if (error) {
      console.error('Error adding data to Supabase:', error);
      res.status(500).send('Failed to add sensor data to the database.');
    } else {
      res.send(`Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);
    }
});

// Route to send sensor data to the client
    app.get('/data', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');  // Disable caching for this endpoint

    try {
        // Fetch the latest 60 records for each sensor
        const { data: sensorData, error } = await supabase
          .from('Sensor_data')
          .select('*')
          .in('sensor_Id', ['sensor_1', 'sensor_2'])
          .order('created_at', { ascending: false })
          .limit(60);

        if (error) {
          console.error('Error fetching data from Supabase:', error);
          res.status(500).send('Failed to retrieve data.');
        } else {
          // Sort data by `created_at` in ascending order (oldest first) for a smooth chart update
          const sortedData = sensorData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

          // Structure the response with separate arrays for each sensor
          const sensor1Data = sortedData.filter(item => item.sensor_Id === 'sensor_1').map(item => item.temperature);
          const sensor2Data = sortedData.filter(item => item.sensor_Id === 'sensor_2').map(item => item.temperature);
          const timestamps = sortedData.map(item => new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          res.json({ sensor1Data, sensor2Data, timestamps });
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).send('An unexpected error occurred.');
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});



