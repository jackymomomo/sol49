import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config'; // Simplified imports
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import NavBar from './navbar';
import NavBar2 from './computerNav';
import BuyingSettings from './Userstats';
import '../scss/settings.scss';

const Settings = () => {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [maxPrice, setMaxPrice] = useState(0.1408);
    const [maxKWh, setMaxKWh] = useState(50.11);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                const uid = user.uid;
                const docRef = doc(db, "userSettings", uid);
                getDoc(docRef).then((docSnap) => {
                    if (docSnap.exists()) {
                        const { maxPrice, maxKWh } = docSnap.data();
                        setMaxPrice(maxPrice);
                        setMaxKWh(maxKWh);
                    }
                });
            } else {
                navigate('/'); // Redirect to login if not authenticated
            }
        });
        return unsubscribe;
    }, []);

    const handleSliderChange = setter => e => setter(parseFloat(e.target.value));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
            const uid = user.uid;
            const userSettingsRef = doc(db, "userSettings", uid);
            try {
                await setDoc(userSettingsRef, { maxPrice, maxKWh }, { merge: true });
                console.log("Settings saved successfully");
                navigate('/dashboard');
            } catch (error) {
                console.error("Error saving settings: ", error);
            }
        }
    };

    return (
        <div className="settings-container">
            {/* {screenWidth < 820 ? <NavBar/> : <NavBar2/>} */}
            <h1>Power Sharing Settings</h1>
            <form onSubmit={handleSubmit}>
                <div className="slider-container">
                    <label>
                        Your Price (per kWh): ${maxPrice.toFixed(4)}
                        <input type="range" min="0.0975" max="10.1408" value={maxPrice} onChange={handleSliderChange(setMaxPrice)} step="0.0001" />
                    </label>
                </div>
                <div className="slider-container">
                    <label>
                        Maximum kWh to Sell: {maxKWh} kWh
                        <input type="range" min="0" max="50.11" value={maxKWh} onChange={handleSliderChange(setMaxKWh)} step="1" />
                    </label>
                </div>
                <button type="submit">Save</button>
            </form>
            <BuyingSettings />
        </div>
    );
};

export default Settings;
