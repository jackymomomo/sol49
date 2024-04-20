const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const {TuyaContext} = require("@tuya/tuya-connector-nodejs");
const axios = require("axios");
const cors = require("cors");
const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);


admin.initializeApp();
const firestore = admin.firestore();
// Express app setup
const app = express();
const tuya = new TuyaContext({
  baseUrl: "https://openapi.tuyaus.com",
  accessKey: functions.config().tuya.accesskey,
  secretKey: functions.config().tuya.secretkey,
  rpc: axios,
});

app.use(cors({origin: true}));
app.use(express.json());

// Endpoint to get device status
app.get("/device-status/:deviceId", async (req, res) => {
  const {deviceId} = req.params;
  try {
    const response = await tuya.request({
      method: "GET",
      path: `/v1.0/devices/${deviceId}/status`,
    });
    res.json(response);
  } catch (error) {
    console.error("Error fetching device status:", error);
    res.status(500).send("Failed to fetch device status");
  }
});

// Endpoint to toggle device switch
app.post("/device-action/:deviceId", async (req, res) => {
  const {deviceId} = req.params;
  const {newState} = req.body;
  try {
    const response = await tuya.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/commands`,
      body: {
        commands: [{code: "switch", value: newState}],
      },
    });
    res.json({success: true, data: response});
  } catch (error) {
    console.error("Error toggling device switch:", error);
    res.status(500).send("Failed to toggle device switch");
  }
});

// Endpoint to retrieve report logs for a device
app.get("/report-logs/:deviceId", async (req, res) => {
  const {deviceId} = req.params;
  const {codes, startTime, endTime, size} = req.query;

  try {
    const response = await tuya.request({
      method: "GET",
      path: `/v2.0/cloud/thing/${deviceId}/report-logs`,
      query: {
        codes,
        start_time: startTime,
        end_time: endTime,
        size: size,
      },
    });
    res.json(response);
  } catch (error) {
    console.error("Error fetching report logs:", error);
    res.status(500).send("Failed to fetch report logs");
  }
});

// Export the app to Firebase Functions
exports.api = functions.https.onRequest(app);


exports.storeEnergyDataPeriodically = functions.pubsub.schedule("every 24 hours").onRun(async (context) => {
  const usersSnapshot = await firestore.collection("users").get();

  for (const userDoc of usersSnapshot.docs) {
    const user = userDoc.data();
    const deviceId = user.deviceID;

    if (!deviceId) {
      console.log(`No device ID for user: ${userDoc.id}`);
      continue; // Skip this iteration if there is no device ID
    }

    // Fetch the energy data from the Tuya IoT API for each user's device ID
    try {
      // You might want to adjust this to fetch logs for the previous day, week, etc., depending on your requirements
      const logsResponse = await tuya.request({
        method: "GET",
        path: `/v2.0/cloud/thing/${deviceId}/report-logs`,
        query: {
          codes: "total_forward_energy",
          start_time: "0", // Assuming you want to start from the earliest record
          end_time: Date.now().toString(), // Up to the current moment
          size: "100", // This might need to be adjusted based on the expected number of logs per day
        },
      });

      const energyLogs = logsResponse.result.logs;

      // Group logs by day
      const dailyUsage = energyLogs.reduce((acc, log) => {
        const day = new Date(log.event_time).toISOString().split("T")[0];
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push(parseInt(log.value, 10));
        return acc;
      }, {});

      // Calculate the daily difference and store in Firestore
      for (const [day, values] of Object.entries(dailyUsage)) {
        if (values.length > 0) {
          const dailyDifference = values[values.length + 1] - values[0]; // Difference between the last and first value of the day
          const userEnergyDocRef = firestore.collection("user_energy").doc(userDoc.id).collection("daily_usage").doc(day);
          await userEnergyDocRef.set({total_forward_energy: dailyDifference}, {merge: true});
        }
      }
      console.log(`Energy data processed and stored for user: ${userDoc.id}`);
    } catch (error) {
      console.error(`Error processing energy data for user: ${userDoc.id}`, error);
    }
  }

  console.log("Energy data processing task completed.");
  return null;
});
