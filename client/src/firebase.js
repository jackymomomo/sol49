
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const baseFire = initializeApp(firebaseConfig);
// Initialize Firestore
const db = getFirestore(app);

export { db };
export default baseFire;

// // src/firebase.js
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyABNECZzFs3Y-av6ejhQSC1d_6fMSN0Ok0",
//   authDomain: "watt-street.firebaseapp.com",
//   projectId: "watt-street",
//   storageBucket: "watt-street.appspot.com",
//   messagingSenderId: "62980562466",
//   appId: "1:62980562466:web:b52d6eed071514f33bb47b",
//   measurementId: "G-BS0TXHPC9D"
// };

// // Initialize Firebase
// const baseFire = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// export default baseFire;