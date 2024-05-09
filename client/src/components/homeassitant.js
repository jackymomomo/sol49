import React, { useState, useEffect } from 'react';

const BatteryPercentage = ({ token, url }) => {
    const [batteryPercentage, setBatteryPercentage] = useState('Loading...');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${url}/api/states/sensor.victron_battery_soc`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                setBatteryPercentage(data.state + '%');
            } catch (error) {
                console.error('Error:', error);
                setBatteryPercentage('Failed to load');
            }
        };

        fetchData();
    }, [token, url]);

    return (
        <div>
            <h2>Battery Percentage</h2>
            <p>{batteryPercentage}</p>
        </div>
    );
};

export default BatteryPercentage;
