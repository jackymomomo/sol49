const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001; // Ensure this port is different from your React app's port

app.use(express.json());

app.all('/api/*', async (req, res) => {
  const url = `https://openapi.tuyaus.com${req.originalUrl.slice(4)}`;
  const clientId = '3xmddyfr5smt4fjfvema'; // Replace with your actual client ID
  const accessToken = '7ba9fc680d83b392c74b15e066d8e8af'; // Replace with your actual access token
  const sign = generateSignature(); // You need to implement this based on Tuya's requirements
  const timestamp = new Date().getTime(); // Current timestamp
  const nonce = generateNonce(); // You need to implement this; it's typically a UUID

  try {
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'client_id': clientId,
        'sign': sign,
        'sign_method': 'HMAC-SHA256',
        't': timestamp,
        'access_token': accessToken,
        'nonce': nonce,
        // Include other headers as needed
      },
      data: req.body,
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error forwarding request', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
