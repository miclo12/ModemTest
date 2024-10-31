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

// Middleware for at parse JSON (nødvendig til POST requests)
app.use(express.json());

// Serve static files (index.html, osv.)
app.use(express.static(path.join(__dirname, 'public')));

// Variabler til at gemme de seneste sensorværdier
let sensor1 = 0;
let sensor2 = 0;

// Route for GET-request (f.eks. fra modem)
app.get('/sensor-data', async (req, res) => {
    sensor1 = parseFloat(req.query.sensor1) || sensor1;
    sensor2 = parseFloat(req.query.sensor2) || sensor2;
    
    console.log(`Opdaterede sensorværdier - Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);

    // Gem data i Supabase
    const { data, error } = await supabase
      .from('Sensor_data')
      .insert([
          { sensor_Id: 'sensor_1', temperature: sensor1 },
          { sensor_Id: 'sensor_2', temperature: sensor2 }
      ]);

    if (error) {
      console.error('Fejl ved tilføjelse af data til Supabase:', error);
      res.status(500).send('Kunne ikke tilføje sensor data til databasen.');
    } else {
      res.send(`Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);
    }
});

// Route for POST-request (alternativ metode til dataoverførsel)
app.post('/sensor-data', async (req, res) => {
    const { sensor1: newSensor1, sensor2: newSensor2 } = req.body;
    sensor1 = newSensor1 || sensor1;
    sensor2 = newSensor2 || sensor2;

    console.log(`Opdaterede sensorværdier via POST - Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);

    // Gem data i Supabase
    const { data, error } = await supabase
      .from('Sensor_data')
      .insert([
          { sensor_Id: 'sensor_1', temperature: sensor1 },
          { sensor_Id: 'sensor_2', temperature: sensor2 }
      ]);

    if (error) {
      console.error('Fejl ved tilføjelse af data til Supabase:', error);
      res.status(500).send('Kunne ikke tilføje sensor data til databasen.');
    } else {
      res.send(`POST: Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);
    }
});

// Route til at sende sensor data til klienten
app.get('/data', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); // Disable caching for denne endpoint

    try {
        const { data: sensorData, error } = await supabase
          .from('Sensor_data')
          .select('*')
          .in('sensor_Id', ['sensor_1', 'sensor_2'])
          .order('created_at', { ascending: false })
          .limit(60);

        if (error) {
          console.error('Fejl ved hentning af data fra Supabase:', error);
          res.status(500).send('Kunne ikke hente data.');
        } else {
          const sortedData = sensorData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          const sensor1Data = sortedData.filter(item => item.sensor_Id === 'sensor_1').map(item => item.temperature);
          const sensor2Data = sortedData.filter(item => item.sensor_Id === 'sensor_2').map(item => item.temperature);
          const timestamps = sortedData.map(item => new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          res.json({ sensor1Data, sensor2Data, timestamps });
        }
    } catch (err) {
        console.error('Uventet fejl:', err);
        res.status(500).send('Der opstod en uventet fejl.');
    }
});

// Start serveren
app.listen(port, () => {
    console.log(`Serveren kører på http://localhost:${port}/`);
});
