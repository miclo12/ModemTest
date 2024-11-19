require('dotenv').config();
const express = require('express'); // Server biblotek
const path = require('path');
const { createClient } = require('@supabase/supabase-js'); //Forbindelse til databasen

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = 'https://pncxmgwqajdxbubxxgyl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

// Global cache control to prevent outdated content
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Serve static files from 'public' directory (f.eks. lindex.html)
app.use(express.static(path.join(__dirname, 'public')));

// Variables to store the latest sensor values
let sensor1 = 0;
let sensor2 = 0;

// Route to receive sensor data from the modem
app.get('/sensor-data', async (req, res) => {
    sensor1 = parseFloat(req.query.sensor1) ||sensor1;    
    sensor2 = parseFloat(req.query.sensor2) ||sensor2;   
    
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
      //res.send(`Sensor 1: ${sensor1}, Sensor 2: ${sensor2}`);
      res.json({ sensor1, sensor2, timestamp: new Date().toISOString() });
    }
});

// Route for POST-request (alternativ metode til dataoverførsel)
/*app.post('/sensor-data', async (req, res) => {
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
*/
///////////////////////////////////////////////////////////////////////////7

app.post('/sensor-data', async (req, res) => {
  const { sensor1_values, sensor2_values } = req.body;
  
  // Validér at input er arrays og har korrekt længde
  /*if (!Array.isArray(sensor1_values) || !Array.isArray(sensor2_values) || 
      sensor1_values.length !== 10 || sensor2_values.length !== 10) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Each sensor must provide exactly 10 values as arrays.'
    });
  }*/
    if (!Array.isArray(sensor1_values) || !Array.isArray(sensor2_values)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Both sensors must provide values as arrays.'
      });
    }
  
    // Validér array længder
    if (sensor1_values.length < 2 || sensor1_values.length > 10 ||
        sensor2_values.length < 2 || sensor2_values.length > 10) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Each sensor must provide between 2 and 10 values.'
      });
    }
 

  try {
    // Indsæt data for sensor 1
    for (let value of sensor1_values) {
      const { error: error1 } = await supabase
        .from('Sensor_data')
        .insert([
          { 
            sensor_Id: 'sensor_1', 
            temperature: parseFloat(value)
          }
        ]);
      
      if (error1) throw error1;
    }

    // Indsæt data for sensor 2
    for (let value of sensor2_values) {
      const { error: error2 } = await supabase
        .from('Sensor_data')
        .insert([
          { 
            sensor_Id: 'sensor_2', 
            temperature: parseFloat(value)
          }
        ]);
      
      if (error2) throw error2;
    }

    res.json({
      message: 'Successfully updated sensor data',
      sensor1_values,
      sensor2_values,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error inserting data into Supabase:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Could not add sensor data to the database.',
    });
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

// Route to fetch latest saved sensor values
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