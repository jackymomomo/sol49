// src/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore
import { getStorage } from "firebase/storage"; // Import the storage service
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyABNECZzFs3Y-av6ejhQSC1d_6fMSN0Ok0",
  authDomain: "watt-street.firebaseapp.com",
  projectId: "watt-street",
  storageBucket: "watt-street.appspot.com",
  messagingSenderId: "62980562466",
  appId: "1:62980562466:web:889f6e2a2bce04a13bb47b",
  measurementId: "G-RMXHCLHQX6"
};
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication and Google Auth Provider
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  const storage = getStorage(app);

  // Initialize Firestore
  const db = getFirestore(app);
  
  const functions = getFunctions(app);


  export { auth, googleProvider, db, storage, functions};
  