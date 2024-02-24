import React from 'react';
import axios from 'axios';
import crypto from 'crypto';

const UserData = () => {
  const fetchUserData = async () => {
    const clientId = '3xmddyfr5smt4fjfvema';
    const secret = '1f798ac5ce304b88b575df687dfa5f67'; // Replace with your actual secret
    const timestamp = new Date().getTime().toString(); // Current timestamp as string
    const method = 'GET';
    const deviceId = 'eb4c7af2945b77cce4xdb9'; // Example device ID
    const uri = `/v1.0/devices/${deviceId}`; // Adjust URI as per your requirement
    const accessToken = 'your_access_token_here'; // Replace with your actual access token

    // Generate the HMAC-SHA256 signature
    const stringToSign = `${clientId}${timestamp}`;
    const sign = crypto.createHmac('sha256', secret).update(stringToSign).digest('hex').toUpperCase();

    const config = {
      method: method,
      url: `https://openapi.tuyacn.com${uri}`,
      headers: {
        'client_id': clientId,
        'sign': sign,
        't': timestamp,
        'sign_method': 'HMAC-SHA256',
        'access_token': accessToken,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await axios(config);
      const data = response.data;
      console.log(data); // Log the data

      // Process the data to update state variables
      // This part depends on the structure of the response data
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  return (
    <div>
      <h1>User Data</h1>
      <button onClick={fetchUserData}>Fetch Data</button>
    </div>
  );
};

export default UserData;
