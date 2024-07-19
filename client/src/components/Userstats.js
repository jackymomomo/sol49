import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../scss/settings.scss';

const BuyingSettings = () => {
    const [maxPrice, setMaxPrice] = useState(0.1408);
    const [kWhToBuy, setKWhToBuy] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                const uid = user.uid;
                const docRef = doc(db, "userBuyingSettings", uid);
                getDoc(docRef).then((docSnap) => {
                    if (docSnap.exists()) {
                        const { maxPrice, kWhToBuy } = docSnap.data();
                        setMaxPrice(maxPrice);
                        setKWhToBuy(kWhToBuy);
                        setTotalCost(maxPrice * kWhToBuy);
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
            const userBuyingSettingsRef = doc(db, "userBuyingSettings", uid);
            try {
                await setDoc(userBuyingSettingsRef, { maxPrice, kWhToBuy }, { merge: true });
                console.log("Buying settings saved successfully");
                navigate('/dashboard');
            } catch (error) {
                console.error("Error saving buying settings: ", error);
            }
        }
    };

    useEffect(() => {
        setTotalCost(maxPrice * kWhToBuy);
    }, [maxPrice, kWhToBuy]);

    return (
        <div className="buying-settings-container">
            <h1>Buying Settings</h1>
            <form onSubmit={handleSubmit}>
                <div className="slider-container">
                    <label>
                        Price (per kWh): ${maxPrice.toFixed(4)}
                        <input type="range" min="0.0975" max="10.1408" value={maxPrice} onChange={handleSliderChange(setMaxPrice)} step="0.0001" />
                    </label>
                </div>
                <div className="slider-container">
                    <label>
                        kWh to Buy: {kWhToBuy} kWh
                        <input type="range" min="0" max="50.11" value={kWhToBuy} onChange={handleSliderChange(setKWhToBuy)} step="1" />
                    </label>
                </div>
                <div className="total-cost">
                    <h2>Total Cost: ${totalCost.toFixed(4)}</h2>
                </div>
                <button type="submit">Save</button>
            </form>
        </div>
    );
};

export default BuyingSettings;
