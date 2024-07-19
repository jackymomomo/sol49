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

// Export the app to Firebase Functions
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


exports.storeOwedAmountPeriodically = functions.pubsub.schedule("every 5 minutes").onRun(async (context) => {
  const usersSnapshot = await firestore.collection("users").get();
  const currentDate = new Date().toISOString().split("T")[0];

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const neighbours = userData.neighbours || [];
    const userId = userDoc.id;

    let totalOwed = 0;
    let energyValueKWh = 0;

    for (const neighbourId of neighbours) {
      const energyQuery = firestore.collection(`user_energy/${neighbourId}/daily_usage`).where("date", "==", currentDate);
      const energySnapshot = await energyQuery.get();

      for (const docSnapshot of energySnapshot.docs) {
        const energyValueWh = docSnapshot.data().total_forward_energy;
        energyValueKWh += energyValueWh / 1000; // Convert Wh to kWh

        const neighbourRef = firestore.collection("users").doc(neighbourId);
        const neighbourSnapshot = await neighbourRef.get();
        const neighbourData = neighbourSnapshot.data();

        if (neighbourData.canSellPower && neighbourData.neighbours.includes(userId)) {
          const settingsRef = firestore.collection("userSettings").doc(neighbourId);
          const settingsSnapshot = await settingsRef.get();
          if (settingsSnapshot.exists) {
            const {maxPrice} = settingsSnapshot.data();
            const owed = energyValueKWh * maxPrice;
            totalOwed += owed;
          }
        }
      }
    }

    if (totalOwed > 0) {
      const dailyOwedRef = firestore.collection(`user_owed/${userId}/daily_owed`).doc(currentDate);
      const dailyOwedDoc = await dailyOwedRef.get();

      if (dailyOwedDoc.exists) {
        // Update the existing document
        const previousTotalOwed = dailyOwedDoc.data().totalOwed || 0;
        await dailyOwedRef.update({totalOwed: previousTotalOwed + totalOwed});
      } else {
        // Create a new document for the current date
        await dailyOwedRef.set({date: currentDate, totalOwed});
      }

      console.log(`Total owed for ${currentDate}: $${totalOwed}`);
    }
  }
});
