import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import NavBar from './navbar';

const Settings = () => {
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [maxKWh, setMaxKWh] = useState(0);
    const auth = getAuth();
    const firestore = getFirestore();
    const navigate = useNavigate(); // Initialize the useNavigate hook

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                const uid = user.uid;
                const docRef = doc(firestore, "userSettings", uid);
                getDoc(docRef).then((docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        setMinPrice(userData.minPrice);
                        setMaxPrice(userData.maxPrice);
                        setMaxKWh(userData.maxKWh);
                    }
                });
            }
        });

        return () => unsubscribe(); // Clean up subscription
    }, [auth, firestore]);

    const handleMinPriceChange = (e) => setMinPrice(e.target.value);
    const handleMaxPriceChange = (e) => setMaxPrice(e.target.value);
    const handleMaxKWhChange = (e) => setMaxKWh(e.target.value);

    const handleSubmit = (e) => {
        e.preventDefault();

        onAuthStateChanged(auth, user => {
            if (user) {
                const uid = user.uid;
                const userSettingsRef = doc(firestore, "userSettings", uid);
                setDoc(userSettingsRef, { minPrice, maxPrice, maxKWh }, { merge: true })
                    .then(() => {
                        console.log("Settings saved successfully");
                        navigate('/dashboard'); // Navigate to /dashboard after saving
                    })
                    .catch((error) => console.error("Error saving settings: ", error));
            }
        });
    };

    return (
        <div>
            <NavBar/>
            <h1>Power Sharing Settings</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Minimum Price (per kWh):
                    <input type="number" value={minPrice} onChange={handleMinPriceChange} />
                </label>
                <br />
                <label>
                    Maximum Price (per kWh):
                    <input type="number" value={maxPrice} onChange={handleMaxPriceChange} />
                </label>
                <br />
                <label>
                    Maximum kWh to Sell:
                    <input type="number" value={maxKWh} onChange={handleMaxKWhChange} />
                </label>
                <br />
                <button type="submit">Save</button>
            </form>
        </div>
    );
};

export default Settings;
