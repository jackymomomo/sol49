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
    const [canSell, setCanSell] = useState(true);
    const [neighbours, setNeighbours] = useState([]);

    useEffect(() => {
        const fetchPersonalDeviceAndNeighbors = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const userRef = doc(db, 'users', user.uid);
            const userSnapshot = await getDoc(userRef);
            if (userSnapshot.exists()) {
                setPersonalDeviceID(userSnapshot.data().deviceID);
                const userData = userSnapshot.data();
                setCanSell(userData.canSell !== false && userData.canSellPower !== false);
                setNeighbours(userData.neighbours || []);
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
                if (neighbours.includes(docSnapshot.id) && docSnapshot.id !== user.uid) {
                    const seller = {
                        uid: docSnapshot.id,
                        name: docSnapshot.data().name,
                        email: docSnapshot.data().email,
                        settingsRef: doc(db, 'userSettings', docSnapshot.id),
                        deviceID: docSnapshot.data().deviceID,
                        energyData: await fetchEnergyData(docSnapshot.id),
                        switchState: docSnapshot.data().deviceID === personalDeviceID ? personalSwitchState : false,
                    };

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
    
            fetchPersonalDeviceAndNeighbors();
            setSellerSettings(sellersData);
        };
    
        const intervalId = setInterval(controlDevices, 900);
        return () => clearInterval(intervalId);
    }, [personalDeviceID, personalSwitchState, neighbours]);

    const fetchEnergyData = async (userId) => {
        const energyRef = collection(db, `user_energy/${userId}/daily_usage`);
        const energySnapshot = await getDocs(energyRef);
        return energySnapshot.docs.map(doc => ({
            date: doc.id,
            usage: doc.data().total_forward_energy
        }));
    };

    const toggleDeviceSwitch = async (deviceId, newState, performSecurityCheck = false) => {
        console.log(`Sending command to ${newState ? 'turn on' : 'turn off'} device ID:`, deviceId);
        try {
            const response = await axios.post(`https://us-central1-watt-street.cloudfunctions.net/api/device-action/${deviceId}`, {
                newState: newState,
            });
            console.log("Toggle response:", response.data);

            if (performSecurityCheck) {
                // Perform security checks here, if necessary
                console.log("Performing security checks and toggling seller's device.");
                // Optionally, find the seller's ID and turn off their device.
                const seller = sellerSettings.find(seller => seller.deviceID !== deviceId);
                if (seller) {
                    await toggleDeviceSwitch(seller.deviceID, false);  // Turn off the seller's device
                }
            }
        } catch (error) {
            console.error('Error toggling switch:', error);
        }
    };

    useEffect(() => {
        if (deviceStatus === 'off' && toggleMode === 'sell') {
            toggleDeviceSwitch(personalDeviceID, false);
            neighbours.forEach(async neighbourId => {
                const neighbourRef = doc(db, 'users', neighbourId);
                const neighbourSnapshot = await getDoc(neighbourRef);
                if (neighbourSnapshot.exists() && neighbourSnapshot.data().deviceID) {
                    await toggleDeviceSwitch(neighbourSnapshot.data().deviceID, false);
                }
            });
        }
    }, [deviceStatus, neighbours, personalDeviceID, toggleMode]);

    const handleToggleMode = async (mode) => {
        toggleMode(mode); // This function should update the mode in your global state/context

        if (mode === 'sell' && personalDeviceID) {
            console.log("Switching to sell mode, turning off personal device.");
            await toggleDeviceSwitch(personalDeviceID, false);
            setPersonalSwitchState(false); // Ensure local state is updated to reflect the switch state
        }
    };

    return (
        <div className="mode-selector">
            <button onClick={() => handleToggleMode('buy')}>Buy Power</button>
            {canSell && <button onClick={() => handleToggleMode('sell')}>Sell Power</button>}
            <button onClick={() => setDeviceStatus('off')}>Turn Off</button>
            {sellerSettings.length > 0 ? sellerSettings.map((seller, index) => (
                <div key={index} style={{ margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
                    <h3>{seller.name} ({seller.email})</h3>
                    <div>Max Price: ${seller.maxPrice ? seller.maxPrice.toFixed(4) : 'N/A'} per kWh</div>
                    <div>Max kWh: {seller.maxKWh ? seller.maxKWh : 'N/A'} kWh</div>
                    <ul>
                        {seller.energyData.map((data, idx) => (
                            <li key={idx}>{data.date}: {data.usage} kWh</li>
                        ))}
                    </ul>
                    <button onClick={() => toggleDeviceSwitch(personalDeviceID, !personalSwitchState, true)}>
                        {personalSwitchState ? 'Turn Off' : 'Turn On'}
                    </button>
                </div>
            )) : <p>No sellers available.</p>}
        </div>
    );
}

export default ModeSelector;
