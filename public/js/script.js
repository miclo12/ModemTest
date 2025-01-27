// script.js

async function fetchDataAndUpdateCharts() {
    try {
        const response = await fetch(`/data?cacheBuster=${Date.now()}`);
        const data = await response.json();

        const now = new Date();
        const timeLabel = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        liveSensorLineChart.data.labels.push(timeLabel);
        liveSensorLineChart.data.datasets[0].data.push(data.sensor1Data.slice(-1)[0]);
        liveSensorLineChart.data.datasets[1].data.push(data.sensor2Data.slice(-1)[0]);

        if (liveSensorLineChart.data.labels.length > 60) {
            liveSensorLineChart.data.labels.shift();
            liveSensorLineChart.data.datasets[0].data.shift();
            liveSensorLineChart.data.datasets[1].data.shift();
        }

        liveSensorLineChart.update();

        updateThermostat('fillSensor1', data.sensor1Data.slice(-1)[0]);
        updateThermostat('fillSensor2', data.sensor2Data.slice(-1)[0]);
    } catch (error) {
        console.error('Error fetching live sensor data:', error);
    }
}

function updateThermostat(elementId, temperature) {
    const fillElement = document.getElementById(elementId);
    const percentage = Math.min(Math.max((temperature + 10) / 40, 0), 1) * 100;
    fillElement.style.height = `${percentage}%`;

    if (temperature < 2) {
        const blueIntensity = Math.max(0, Math.min(255, 255 - (temperature + 10) * 25));
        fillElement.style.backgroundColor = `rgb(0, 0, ${blueIntensity})`;
    } else {
        const redIntensity = Math.max(0, Math.min(255, 100 + temperature * 5));
        fillElement.style.backgroundColor = `rgb(${redIntensity}, 0, 0)`;
    }
}

const liveCtx = document.getElementById('liveSensorLineChart').getContext('2d');
const liveSensorLineChart = new Chart(liveCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Sensor 1',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            },
            {
                label: 'Sensor 2',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                min: -10,
                max: 30,
                title: { display: true, text: 'Degrees Celsius' }
            },
            x: {
                title: { display: true, text: 'Time (HH:MM)' }
            }
        }
    }
});

setInterval(fetchDataAndUpdateCharts, 5000);
