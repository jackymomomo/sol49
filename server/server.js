const express = require('express');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3001;


// Initialize TuyaContext with your Tuya credentials
const tuya = new TuyaContext({
  baseUrl: 'https://openapi.tuyaus.com',
  accessKey: '3xmddyfr5smt4fjfvema', // Replace with your Access Key
  secretKey: '1f798ac5ce304b88b575df687dfa5f67', // Replace with your Secret Key
  rpc: axios,
});

app.use(cors()); // Enable CORS for all origins (Adjust in production)
app.use(express.json());
// Endpoint to get device status
app.get('/device-status/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  try {
    const response = await tuya.request({
      method: 'GET',
      path: `/v1.0/devices/${deviceId}/status`,
    });
    res.json(response);
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).send('Failed to fetch device status');
  }
});

// Endpoint to toggle device switch
app.post('/device-action/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const { newState } = req.body; // Ensure the request body contains 'newState' key with boolean value

  try {
    const response = await tuya.request({
      method: 'POST',
      path: `/v1.0/devices/${deviceId}/commands`,
      body: {
        commands: [{code: "switch", value: newState}]
      },
    });
    res.json({success: true, data: response});
  } catch (error) {
    console.error('Error toggling device switch:', error);
    res.status(500).send('Failed to toggle device switch');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
