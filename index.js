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
      .from('Sensor_data')
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

// Route to send sensor data to the client for live chart
app.get('/data', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    try {
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
          const sortedData = sensorData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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

// Route to fetch latest 10 saved sensor values
app.get('/latest-data', async (req, res) => {
    try {
        const { data: sensorData, error } = await supabase
          .from('Sensor_data')
          .select('*')
          .in('sensor_Id', ['sensor_1', 'sensor_2'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching latest data from Supabase:', error);
          res.status(500).send('Failed to retrieve latest data.');
        } else {
          const sortedData = sensorData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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

// Serve a new HTML page for latest data
app.get('/latest', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'latest.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
