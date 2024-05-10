import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase-config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';
import { useDevice } from '../context/deviceContext';
import '../scss/buy&sel.scss';

function ModeSelector({ toggleMode }) {
    const { deviceStatus, setDeviceStatus } = useDevice();
    const [personalSwitchState, setPersonalSwitchState] = useState(false);
    const [personalDeviceID, setPersonalDeviceID] = useState(null);
    const [sellerSettings, setSellerSettings] = useState([]);
    const [canSell, setCanSell] = useState(true);
    const [neighbours, setNeighbours] = useState([]);
    const [currentMode, setCurrentMode] = useState('off'); // This will keep track of the current mode

    useEffect(() => {
        const fetchPersonalDeviceAndNeighbors = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const userRef = doc(db, 'users', user.uid);
            const userSnapshot = await getDoc(userRef);
            if (userSnapshot.exists()) {
                setPersonalDeviceID(userSnapshot.data().deviceID);
                setCanSell(userSnapshot.data().canSell !== false && userSnapshot.data().canSellPower !== false);
                setNeighbours(userSnapshot.data().neighbours || []);
            }
        };

        const controlDevices = async () => {
            if (currentMode !== 'buy') return; // Only fetch seller data if in 'buy' mode.

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

                    const settingsSnapshot = await getDoc(seller.settingsRef);
                    if (settingsSnapshot.exists()) {
                        const { maxPrice, maxKWh } = settingsSnapshot.data();
                        seller.maxPrice = maxPrice;
                        seller.maxKWh = maxKWh;
                    }

                    sellersData.push(seller);
                }
            }

            setSellerSettings(sellersData);
        };

        fetchPersonalDeviceAndNeighbors();
        const intervalId = setInterval(controlDevices, 900);
        return () => clearInterval(intervalId);
    }, [personalDeviceID, personalSwitchState, neighbours, currentMode]);

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
        setCurrentMode(mode); // Update the current mode

        if (mode === 'sell' && personalDeviceID) {
            console.log("Switching to sell mode, turning off personal device.");
            await toggleDeviceSwitch(personalDeviceID, false);
            setPersonalSwitchState(false); // Ensure local state is updated to reflect the switch state
        }
    };

    return (
        <div className="mode-selector">
        <div className="mode-switches">
            <button className={`switch-button buy ${currentMode === 'buy' ? 'active' : ''}`} onClick={() => handleToggleMode('buy')}>
                Buy Power
            </button>
            {canSell && (
                <button className={`switch-button sell ${currentMode === 'sell' ? 'active' : ''}`} onClick={() => handleToggleMode('sell')}>
                    Sell Power
                </button>
            )}
            <button className={`switch-button off ${currentMode === 'off' ? 'active' : ''}`} onClick={() => handleToggleMode('off')}>
                Turn Off
            </button>
        </div>
        {currentMode === 'buy' && sellerSettings.length > 0 ? (
            <div className="sellers-list">
                {sellerSettings.map((seller, index) => (
                    <div className="seller-info" key={index}>
                        <h3>{seller.name} ({seller.email})</h3>
                        <ul>
                            {seller.energyData.map((data, idx) => (
                                <li key={idx}>{data.date}: {data.usage} kWh</li>
                            ))}
                        </ul>
                    </div>
                    
                ))}
                <button className="toggle-device" onClick={() => toggleDeviceSwitch(personalDeviceID, !personalSwitchState, true)}>
                                {personalSwitchState ? 'Turn Off' : 'Turn On'}
                            </button>
            </div>
        ) : currentMode === 'buy' ? <p className="no-sellers">No sellers available.</p> : null}
    </div>
    );
}

export default ModeSelector;
