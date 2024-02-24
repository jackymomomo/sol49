const functions = require("firebase-functions");
const axios = require("axios");
const CryptoJS = require("crypto-js");

exports.fetchDeviceStatus = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const clientId = "3xmddyfr5smt4fjfvema";
  const accessToken = "7ba9fc680d83b392c74b15e066d8e8af";
  const secret = "1f798ac5ce304b88b575df687dfa5f67";
  const t = new Date().getTime();
  const signString = `${clientId}${accessToken}${t}`;
  const sign = CryptoJS.HmacSHA256(signString, secret).toString().toUpperCase();

  try {
    const response = await axios.get("https://openapi.tuyaus.com/v1.0/devices/eb4c7af2945b77cce4xdb9/status", {
      headers: {
        "client_id": clientId,
        "sign": sign,
        "sign_method": "HMAC-SHA256",
        "access_token": accessToken,
        "t": t.toString(),
      },
    });
    res.status(200).json({data: response.data});
  } catch (error) {
    console.error("Error fetching device status:", error);
    res.status(500).send("Failed to fetch device status");
  }
});
