// src/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyABNECZzFs3Y-av6ejhQSC1d_6fMSN0Ok0",
  authDomain: "watt-street.firebaseapp.com",
  projectId: "watt-street",
  storageBucket: "watt-street.appspot.com",
  messagingSenderId: "62980562466",
  appId: "1:62980562466:web:b52d6eed071514f33bb47b",
  measurementId: "G-BS0TXHPC9D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Google Auth Provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
