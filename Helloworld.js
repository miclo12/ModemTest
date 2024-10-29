const mqtt = require('mqtt');
const axios = require('axios');

// Connect to the local Mosquitto broker
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Subscribe to a topic
    client.subscribe('test/topic', (err) => {
        if (!err) {
            console.log('Subscribed to test/topic');

            // Publish a message every 5 seconds
            setInterval(() => {
                client.publish('test/topic', 'Hello, World! at ' + new Date().toISOString());
            }, 5000);
        }
    });
});

// When a message is received
client.on('message', (topic, message) => {
    console.log(`Received message on ${topic}: ${message.toString()}`);

    // Define the local URL for the GET request
    const url = 'http://127.0.0.1:3001/api/data'; // Use IPv4 address

    // Send a GET request
    axios.get(url)
        .then(response => {
            console.log('GET response:', response.data);
        })
        .catch(error => {
            console.error('Error making GET request:', error);
        });
});

// Error handling
client.on('error', (err) => {
    console.error('Connection error: ', err);
});

client.on('close', () => {
    console.log('Connection closed');
});
