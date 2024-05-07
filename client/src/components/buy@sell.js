import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase-config';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';

function ModeSelector({ toggleMode, deviceStatus, setDeviceStatus }) {
    const [sellerSettings, setSellerSettings] = useState([]);

    useEffect(() => {
        const controlDevices = async () => {
            const user = auth.currentUser;
            if (!user) return;
    
            const devicesRef = collection(db, 'users'); 
            const q = query(devicesRef, where("mode", "==", "sell"));
            const querySnapshot = await getDocs(q);
            let sellersData = [];
    
            querySnapshot.forEach((docSnapshot) => {
                if (docSnapshot.id !== user.uid) {
                    sellersData.push({
                        uid: docSnapshot.id,
                        name: docSnapshot.data().name,
                        email: docSnapshot.data().email,
                        settingsRef: doc(db, 'userSettings', docSnapshot.id),
                        deviceID: docSnapshot.data().deviceID  // Assume device ID is stored directly in user's document
                    });
                }
            });
    
            const sellersCompleteData = await Promise.all(sellersData.map(async (seller) => {
                const settingsSnapshot = await getDoc(seller.settingsRef);
                return {
                    ...seller,
                    pricePerKWh: settingsSnapshot.data().maxPrice,
                    maxKWh: settingsSnapshot.data().maxKWh
                };
            }));
    
            setSellerSettings(sellersCompleteData);
        };
    
        const intervalId = setInterval(controlDevices, 10000);
        return () => clearInterval(intervalId);
    }, []);

    const toggleDeviceSwitch = async (deviceID, newState) => {
        console.log("Toggling device switch for ID:", deviceID, "New State:", newState);
        try {
            const response = await axios.post(`https://us-central1-watt-street.cloudfunctions.net/api/device-action/${deviceID}`, {
                newState: newState,
            });
            console.log("Toggle response:", response.data);
        } catch (error) {
            console.error('Error toggling switch:', error);
        }
    };
    
    const initiateTransaction = async (seller) => {
        const buyer = auth.currentUser;
        if (!buyer) {
            console.error("No user logged in");
            return;
        }
    
        const settingsRef = doc(db, 'userSettings', seller.uid);
        const settingsSnapshot = await getDoc(settingsRef);
    
        if (!settingsSnapshot.exists()) {
            console.error("Seller settings not found");
            return;
        }
    
        const { maxPrice, maxKWh } = settingsSnapshot.data();
        const confirm = window.confirm(`Do you want to buy up to ${maxKWh} kWh at $${maxPrice} per kWh from ${seller.name}?`);
    
        if (confirm) {
            const transactionRef = collection(db, 'transactions');
            const transactionData = {
                buyerUID: buyer.uid,
                sellerUID: seller.uid,
                pricePerKWh: maxPrice,
                kWh: maxKWh,
                status: 'pending',
                timestamp: new Date()
            };
    
            try {
                await addDoc(transactionRef, transactionData);
                console.log(`Transaction successfully initiated with ${seller.name}`);
                // Toggle the seller's device switch on
                toggleDeviceSwitch(seller.deviceID, true); 
            } catch (error) {
                console.error("Failed to record transaction:", error);
            }
        } else {
            console.log("Transaction cancelled by the user.");
        }
    };

    return (
        <div className="mode-selector">
            <button onClick={() => toggleMode('buy')}>Buy Power</button>
            <button onClick={() => toggleMode('sell')}>Sell Power</button>
            {sellerSettings.map((seller, index) => (
                <div key={index} style={{ margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
                    <h3>{seller.name} ({seller.email})</h3>
                    <p>Price per kWh: ${seller.pricePerKWh ? seller.pricePerKWh.toFixed(2) : 'N/A'}</p>
                    <p>Maximum kWh available: {seller.maxKWh}</p>
                    <button onClick={() => initiateTransaction(seller)}>Buy Energy</button>
                </div>
            ))}
        </div>
    );
}

export default ModeSelector;
