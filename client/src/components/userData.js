import React, { useState } from 'react';
import axios from 'axios';
import { HmacSHA256, enc } from 'crypto-js';

const config = {
  host: 'https://openapi.tuyacn.com',
  accessKey: 'efde994a1e56e406b3168c252e979acb', // Example Access Key
  secretKey: '1f798ac5ce304b88b575df687dfa5f67', // Example Secret Key
  deviceId: 'eb4c7af2945b77cce4xdb9', // Example Device ID
  clientId: '3xmddyfr5smt4fjfvema',
};

const generateSignature = (method, uri, body = '') => {
    const timestamp = new Date().getTime(); // Use getTime() for milliseconds
    const headers = [method.toUpperCase(), '', '', uri, `${config.clientId}${timestamp}`];

    if (method.toUpperCase() !== 'GET' && body) {
      const contentHash = HmacSHA256(body, config.secretKey).toString(enc.Hex);
      headers[1] = contentHash;
    }

    const stringToSign = headers.join('\n');
    const sign = HmacSHA256(stringToSign, config.secretKey).toString(enc.Hex).toUpperCase();
    console.log('Signature:', sign, 'String to Sign:', stringToSign, 'Timestamp:', timestamp);
    return { sign, timestamp: timestamp.toString() };
};

const fetchToken = async () => {
    const method = 'GET';
    const uri = '/v1.0/token?grant_type=1';
    const { sign, timestamp } = generateSignature(method, uri);

    try {
      const response = await axios({
        method,
        url: `${config.host}${uri}`,
        headers: {
          'client_id': config.clientId,
          'sign': sign,
          't': timestamp,
          'sign_method': 'HMAC-SHA256',
        },
      });
      console.log("API response:", response);
      if (response.data.result && response.data.result.access_token) {
        return response.data.result.access_token;
      } else {
        console.error('Unexpected API response structure:', response.data);
        throw new Error('Failed to fetch token due to unexpected API response structure');
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      throw error; // Rethrow the original error for upstream handling
    }
};

  

const fetchDeviceStatus = async (token) => {
  const method = 'GET';
  const uri = `/v1.0/devices/${config.deviceId}`;
  const { sign, timestamp } = generateSignature(method, uri);

  try {
    const response = await axios({
      method: method,
      url: `${config.host}${uri}`,
      headers: {
        'client_id': config.clientId,
        'sign': sign,
        't': timestamp,
        'accessKey': token,
        'sign_method': 'HMAC-SHA256',
      },
    });
    return response.data.result;
  } catch (error) {
    console.error('Error fetching device status:', error);
    throw new Error('Failed to fetch device status');
  }
};

const DeviceStatusComponent = () => {
  const [deviceStatus, setDeviceStatus] = useState(null);

  const handleFetchStatus = async () => {
    try {
      const token = await fetchToken();
      const status = await fetchDeviceStatus(token);
      setDeviceStatus(status);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Device Status</h1>
      <button onClick={handleFetchStatus}>Fetch Status</button>
      {deviceStatus && <pre>{JSON.stringify(deviceStatus, null, 2)}</pre>}
    </div>
  );
};

export default DeviceStatusComponent;
