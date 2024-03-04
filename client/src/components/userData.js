import React, { useState } from 'react';
import axios from 'axios';

const DeviceStatusComponent = () => {
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDeviceStatus = async () => {
    setIsLoading(true);
    try {
      // Ensure to replace 'http://localhost:5000' with your actual server URL
      const response = await axios.get(`http://localhost:3001/device-status/eb4c7af2945b77cce4xdb9`);
      setDeviceStatus(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch device status:', error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Device Status</h1>
      <button onClick={fetchDeviceStatus} disabled={isLoading}>
        {isLoading ? 'Fetching...' : 'Fetch Status'}
      </button>
      {deviceStatus && <pre>{JSON.stringify(deviceStatus, null, 2)}</pre>}
    </div>
  );
};

export default DeviceStatusComponent;
