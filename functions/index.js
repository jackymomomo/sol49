const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');
const axios = require('axios');
const cors = require('cors');

admin.initializeApp();

const app = express();

// Initialize TuyaContext with your Tuya credentials
// Note: It's better to use environment variables for sensitive information
const tuya = new TuyaContext({
  baseUrl: 'https://openapi.tuyaus.com',
  accessKey: functions.config().tuya.accesskey, // Use environment variables
  secretKey: functions.config().tuya.secretkey, // Use environment variables
  rpc: axios,
});

app.use(cors({ origin: true })); // Adjust in production as needed
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
  const { newState } = req.body;

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

// Export the app to Firebase Functions
exports.api = functions.https.onRequest(app);
