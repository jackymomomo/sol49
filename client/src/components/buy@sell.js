import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase-config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';
import { useDevice } from '../context/deviceContext';

function ModeSelector({ toggleMode }) {
    const { deviceStatus, setDeviceStatus } = useDevice();
    const [personalSwitchState, setPersonalSwitchState] = useState(false);
    const [personalDeviceID, setPersonalDeviceID] = useState(null);
    const [sellerSettings, setSellerSettings] = useState([]);

    useEffect(() => {
        const fetchPersonalDevice = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const userRef = doc(db, 'users', user.uid);
            const userSnapshot = await getDoc(userRef);
            if (userSnapshot.exists()) {
                setPersonalDeviceID(userSnapshot.data().deviceID);
            }
        };

        const controlDevices = async () => {
            const user = auth.currentUser;
            if (!user) return;
    
            const devicesRef = collection(db, 'users'); 
            const q = query(devicesRef, where("mode", "==", "sell"));
            const querySnapshot = await getDocs(q);
            let sellersData = [];
    
            for (const docSnapshot of querySnapshot.docs) {
                if (docSnapshot.id !== user.uid) {
                    const seller = {
                        uid: docSnapshot.id,
                        name: docSnapshot.data().name,
                        email: docSnapshot.data().email,
                        settingsRef: doc(db, 'userSettings', docSnapshot.id),
                        deviceID: docSnapshot.data().deviceID,
                        energyData: [],
                        switchState: docSnapshot.data().deviceID === personalDeviceID ? personalSwitchState : false,
                    };

                    // Fetch historical energy usage data
                    const energyRef = collection(db, `user_energy/${seller.uid}/daily_usage`);
                    const energyDocs = await getDocs(energyRef);
                    energyDocs.forEach(doc => {
                        seller.energyData.push({
                            date: doc.id,
                            usage: doc.data().total_forward_energy
                        });
                    });

                    // Fetch seller settings
                    const settingsSnapshot = await getDoc(seller.settingsRef);
                    if (settingsSnapshot.exists()) {
                        const { maxPrice, maxKWh } = settingsSnapshot.data();
                        seller.maxPrice = maxPrice;
                        seller.maxKWh = maxKWh;
                    }

                    sellersData.push(seller);
                }
            }
    
            fetchPersonalDevice();
            setSellerSettings(sellersData);
        };
    
        const intervalId = setInterval(controlDevices, 10000);
        return () => clearInterval(intervalId);
    }, []);

    const toggleDeviceSwitch = async () => {
        const newState = !personalSwitchState;
        console.log(`Sending command to ${newState ? 'turn on' : 'turn off'} personal device ID:`, personalDeviceID);
        try {
            const response = await axios.post(`https://us-central1-watt-street.cloudfunctions.net/api/device-action/${personalDeviceID}`, {
                newState: newState,
            });
            console.log("Toggle response:", response.data);
            setPersonalSwitchState(newState);
        } catch (error) {
            console.error('Error toggling switch:', error);
        }
    };

    const disablePersonalPower = async () => {
        console.log("Disabling personal power for device ID:", personalDeviceID);
        try {
            const response = await axios.post(`https://us-central1-watt-street.cloudfunctions.net/api/device-action/${personalDeviceID}`, {
                newState: false,
            });
            console.log("Disable response:", response.data);
            setDeviceStatus({ ...deviceStatus, switch: false });
        } catch (error) {
            console.error('Error disabling personal power:', error);
        }
    };

    return (
        <div className="mode-selector">
            <button onClick={() => toggleMode('buy')}>Buy Power</button>
            <button onClick={() => toggleMode('sell')}>Sell Power</button>
            <button onClick={disablePersonalPower}>Disable Personal Power</button>
            {sellerSettings.map((seller, index) => (
                <div key={index} style={{ margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
                    <h3>{seller.name} ({seller.email})</h3>
                    <div>Max Price: ${seller.maxPrice ? seller.maxPrice.toFixed(4) : 'N/A'} per kWh</div>
                    <div>Max kWh: {seller.maxKWh ? seller.maxKWh : 'N/A'} kWh</div>
                    <ul>
                        {seller.energyData.map((data, idx) => (
                            <li key={idx}>{data.date}: {data.usage} kWh</li>
                        ))}
                    </ul>
                    <button onClick={toggleDeviceSwitch}>
                        {personalSwitchState ? 'Turn Off' : 'Turn On'}
                    </button>
                </div>
            ))}
        </div>
    );
}

export default ModeSelector;