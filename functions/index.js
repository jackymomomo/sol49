const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const {TuyaContext} = require("@tuya/tuya-connector-nodejs");
const axios = require("axios");
const cors = require("cors");
const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);
const corsHandler = cors({origin: true});


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

// Export the app to firebase Functions
exports.api = functions.https.onRequest(app);

exports.storeEnergyDataPeriodically = functions.pubsub.schedule("every minute").onRun(async (context) => {
  const usersSnapshot = await firestore.collection("users").get();

  for (const userDoc of usersSnapshot.docs) {
    const user = userDoc.data();
    const deviceId = user.deviceID;
    if (!deviceId) {
      console.log(`No device ID for user: ${userDoc.id}`);
      continue;
    }

    let lastRowKey = null;
    let hasMore = true;
    const energyData = [];

    while (hasMore) {
      try {
        const logsResponse = await tuya.request({
          method: "GET",
          path: `/v2.0/cloud/thing/${deviceId}/report-logs`,
          query: {
            codes: "total_forward_energy",
            start_time: "0",
            end_time: Date.now().toString(),
            size: "100",
            last_row_key: lastRowKey,
          },
        });

        if (logsResponse.success && logsResponse.result && logsResponse.result.logs.length) {
          energyData.push(...logsResponse.result.logs);
          lastRowKey = logsResponse.result.last_row_key;
          hasMore = !!lastRowKey;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error fetching energy logs for device ${deviceId} of user ${userDoc.id}:`, error);
        break;
      }
    }

    // Process the fetched energy data to calculate daily totals
    if (energyData.length) {
      const dailyTotals = energyData.reduce((acc, log) => {
        const day = new Date(parseInt(log.event_time)).toISOString().split("T")[0];
        const value = parseInt(log.value, 10);

        if (!acc[day]) {
          acc[day] = {startValue: value, lastValue: value};
        } else {
          if (value < acc[day].startValue) acc[day].startValue = value;
          if (value > acc[day].lastValue) acc[day].lastValue = value;
        }

        return acc;
      }, {});

      for (const [day, {startValue, lastValue}] of Object.entries(dailyTotals)) {
        const dailyTotal = lastValue - startValue;
        const userEnergyDocRef = firestore.collection("user_energy").doc(userDoc.id).collection("daily_usage").doc(day);
        // Set only updates the provided fields, hence not overwriting other data
        await userEnergyDocRef.set({total_forward_energy: dailyTotal}, {merge: true});
      }
    } else {
      console.log(`No energy data found for device ${deviceId} of user ${userDoc.id}`);
    }
  }

  console.log("Energy data processing task completed.");
});

exports.proxyBatteryStatus = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      const result = await axios.get("https://moondance.savaryliving.com/api/states/sensor.victron_battery_soc", {
        headers: {
          "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0MWYyZDAyNGI3OTg0MmYxYWRmMjliM2Y3N2Q4ODE0MCIsImlhdCI6MTcxNTI0NDkwNSwiZXhwIjoyMDMwNjA0OTA1fQ.7rPPRAjxnzEr397Nu2QvsLF_h5MP4t2X0x3-w0jK5ko`,
          "Content-Type": "application/json",
        },
      });
      response.send(result.data);
    } catch (error) {
      console.error("Failed to fetch from Home Assistant:", error);
      response.status(500).send("Server Error");
    }
  });
});


exports.storePriceDataPeriodically = functions.pubsub.schedule("every 5 minutes").onRun(async (context) => {
  const usersSnapshot = await firestore.collection("users").get();

  for (const userDoc of usersSnapshot.docs) {
    const user = userDoc.data();
    const deviceId = user.deviceID;
    if (!deviceId) {
      console.log(`No device ID for user: ${userDoc.id}`);
      continue;
    }

    const userSettingsRef = firestore.collection("userSettings").doc(userDoc.id);
    const userSettingsDoc = await userSettingsRef.get();
    if (!userSettingsDoc.exists) {
      console.log(`No settings found for user: ${userDoc.id}`);
      continue;
    }

    const {maxPrice} = userSettingsDoc.data();
    if (!maxPrice) {
      console.log(`No price set for user: ${userDoc.id}`);
      continue;
    }

    let lastRowKey = null;
    let hasMore = true;
    const energyData = [];

    while (hasMore) {
      try {
        const logsResponse = await tuya.request({
          method: "GET",
          path: `/v2.0/cloud/thing/${deviceId}/report-logs`,
          query: {
            codes: "total_forward_energy",
            start_time: "0",
            end_time: Date.now().toString(),
            size: "100",
            last_row_key: lastRowKey,
          },
        });

        if (logsResponse.success && logsResponse.result && logsResponse.result.logs.length) {
          energyData.push(...logsResponse.result.logs);
          lastRowKey = logsResponse.result.last_row_key;
          hasMore = !!lastRowKey;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error fetching energy logs for device ${deviceId} of user ${userDoc.id}:`, error);
        break;
      }
    }

    if (energyData.length) {
      const dailyTotals = energyData.reduce((acc, log) => {
        const day = new Date(parseInt(log.event_time)).toISOString().split("T")[0];
        const value = parseInt(log.value, 10);

        if (!acc[day]) {
          acc[day] = {startValue: value, lastValue: value};
        } else {
          if (value < acc[day].startValue) acc[day].startValue = value;
          if (value > acc[day].lastValue) acc[day].lastValue = value;
        }

        return acc;
      }, {});

      for (const [day, {startValue, lastValue}] of Object.entries(dailyTotals)) {
        const dailyTotalKWh = (lastValue - startValue) / 100; // Convert Wh to kWh
        const dailyCost = dailyTotalKWh * maxPrice;
        const userEnergyDocRef = firestore.collection("user_energy").doc(userDoc.id).collection("daily_usage").doc(day);

        await userEnergyDocRef.set({
          total_forward_energy: dailyTotalKWh,
          price_per_kWh: maxPrice,
          daily_cost: dailyCost,
        }, {merge: true});
      }
    } else {
      console.log(`No energy data found for device ${deviceId} of user ${userDoc.id}`);
    }
  }

  console.log("Price data processing task completed.");
});
