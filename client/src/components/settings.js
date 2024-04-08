import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import NavBar from './navbar';
import '../scss/settings.scss';

const Settings = () => {
    const [minPrice, setMinPrice] = useState(0.0975); // Adjusted default to BC Hydro Step 1 energy charge
    const [maxPrice, setMaxPrice] = useState(0.1408); // Adjusted default to BC Hydro Step 2 energy charge
    const [maxKWh, setMaxKWh] = useState(1376); // Adjusted default to BC Hydro first step limit
    const auth = getAuth();
    const firestore = getFirestore();
    const navigate = useNavigate();

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

        return () => unsubscribe();
    }, [auth, firestore]);

    const handleSliderChange = (setter) => (e) => setter(parseFloat(e.target.value));

    const handleSubmit = (e) => {
        e.preventDefault();

        onAuthStateChanged(auth, user => {
            if (user) {
                const uid = user.uid;
                const userSettingsRef = doc(firestore, "userSettings", uid);
                setDoc(userSettingsRef, { minPrice, maxPrice, maxKWh }, { merge: true })
                    .then(() => {
                        console.log("Settings saved successfully");
                        navigate('/dashboard');
                    })
                    .catch((error) => console.error("Error saving settings: ", error));
            }
        });
    };

    return (
        <div className="settings-container">
            <NavBar/>
            <h1>Power Sharing Settings</h1>
            <form onSubmit={handleSubmit}>
                <div className="slider-container">
                    <label>
                        Minimum Price (per kWh): ${minPrice.toFixed(4)}
                        <input type="range" min="0" max="1.1408" value={minPrice} onChange={handleSliderChange(setMinPrice)} step="0.0001" />
                    </label>
                </div>
                <div className="slider-container">
                    <label>
                        Maximum Price (per kWh): ${maxPrice.toFixed(4)}
                        <input type="range" min="0.0975" max="1.1408" value={maxPrice} onChange={handleSliderChange(setMaxPrice)} step="0.0001" />
                    </label>
                </div>
                <div className="slider-container">
                    <label>
                        Maximum kWh to Sell: {maxKWh} kWh
                        <input type="range" min="0" max="50" value={maxKWh} onChange={handleSliderChange(setMaxKWh)} step="1" />
                    </label>
                </div>
                <button type="submit">Save</button>
            </form>
        </div>
    );
};

export default Settings;
