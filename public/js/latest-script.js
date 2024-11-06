document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById('latestSensorLineChart')?.getContext('2d');
    
    if (!ctx) {
        console.error('Chart element not found');
        return;
    }

    const latestSensorLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Sensor 1',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false,
                },
                {
                    label: 'Sensor 2',
                    data: [],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false,
                }
            ]
        },
        options: {
            responsive: true,
            animation: false, // Disable animation for performance
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Degrees Celsius'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time (HH:MM)'
                    }
                }
            }
        }
    });

    let latestTimestamp = null;

    // Fetch and update data with debouncing
    const fetchLatestData = async () => {
        try {
            const response = await fetch(`/data?cacheBuster=${Date.now()}`);
            const data = await response.json();

            if (data.timestamps.length > 0) {
                const newTimestamp = data.timestamps[data.timestamps.length - 1];

                if (newTimestamp !== latestTimestamp) {
                    latestTimestamp = newTimestamp;

                    // Update chart with latest data
                    latestSensorLineChart.data.labels = data.timestamps;
                    latestSensorLineChart.data.datasets[0].data = data.sensor1Data;
                    latestSensorLineChart.data.datasets[1].data = data.sensor2Data;

                    // Debounced chart update
                    requestAnimationFrame(() => {
                        latestSensorLineChart.update();
                    });

                    // Calculate averages
                    const sensor1Average = calculateAverage(data.sensor1Data);
                    const sensor2Average = calculateAverage(data.sensor2Data);

                    // Display averages in the box
                    const averageBox = document.getElementById('averageBox');
                    if (averageBox) {
                        averageBox.textContent = 
                            `Average: Sensor 1 = ${sensor1Average.toFixed(2)}°C, Sensor 2 = ${sensor2Average.toFixed(2)}°C`;
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching latest sensor data:', error);
        }
    };

    // Helper function to calculate average
    function calculateAverage(data) {
        if (data.length === 0) return 0;
        const sum = data.reduce((acc, value) => acc + value, 0);
        return sum / data.length;
    }

    // Set interval to fetch data every 20 seconds
    setInterval(fetchLatestData, 20000);
    fetchLatestData(); // Initial fetch on page load
});

