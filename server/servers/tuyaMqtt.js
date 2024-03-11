// Import the necessary libraries
const TuyaWebsocket = require('./path/to/tuyaWebsocket'); // Adjust the path as necessary
const WebSocket = require('ws');

// Configure the TuyaWebsocket client
const client = new TuyaWebsocket({
  accessId: "3xmddyfr5smt4fjfvema",
  accessKey: "1f798ac5ce304b88b575df687dfa5f67",
  url: TuyaWebsocket.URL.CN, // Choose the appropriate URL
  env: TuyaWebsocket.env.TEST, // Or PROD, depending on your environment
  maxRetryTimes: 50,
});

// Example function to connect and handle messages
function connectToTuya() {
  const ws = new WebSocket(client.url);

  ws.on('open', function open() {
    console.log('Connected to Tuya');
    // You might need to authenticate or subscribe to specific topics here
  });

  ws.on('message', function incoming(data) {
    console.log('Received message:', data);
    // Here you can parse and handle the message as needed
  });

  ws.on('close', function close() {
    console.log('Disconnected from Tuya');
    // Handle reconnection logic here if needed
  });

  // Handle errors
  ws.on('error', function error(err) {
    console.error('Connection error:', err);
  });
}

// Call the function to start the connection
connectToTuya();
