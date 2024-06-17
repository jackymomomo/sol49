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
    const [currentMode, setCurrentMode] = useState('');
    const [neighbourModes, setNeighbourModes] = useState({});

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                getDoc(userRef).then((userSnapshot) => {
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.data();
                        setPersonalDeviceID(userData.deviceID || null);
                        setCanSell(userData.canSell !== false && userData.canSellPower !== false);
                        setNeighbours(userData.neighbours || []);
                        setCurrentMode(userData.mode || 'off');
                    }
                }).catch((error) => {
                    console.error("Failed to fetch user data:", error);
                });
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!neighbours.length) return;

        const fetchNeighboursData = async () => {
            let neighbourData = {};
            for (const neighbourId of neighbours) {
                const neighbourRef = doc(db, 'users', neighbourId);
                const docSnap = await getDoc(neighbourRef);
                if (docSnap.exists()) {
                    neighbourData[neighbourId] = docSnap.data().mode;
                }
            }
            setNeighbourModes(neighbourData);
        };

        fetchNeighboursData();
    }, [neighbours]);

    useEffect(() => {
        const activeSellers = Object.values(neighbourModes).filter(mode => mode === 'sell').length;
        const shouldTurnOn = currentMode !== 'off' && activeSellers > 0 && !Object.values(neighbourModes).some(mode => mode === 'buy' && activeSellers > 1);

        toggleDeviceSwitch(personalDeviceID, shouldTurnOn);
    }, [neighbourModes, currentMode]);

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

    useEffect(() => {
        if (deviceStatus === 'off') {
            toggleMode('off'); // Turn off the mode globally
            setCurrentMode('off'); // Update local state
            toggleDeviceSwitch(personalDeviceID, false); // Turn off personal device

            neighbours.forEach(async neighbourId => {
                const neighbourRef = doc(db, 'users', neighbourId);
                const neighbourSnapshot = await getDoc(neighbourRef);
                if (neighbourSnapshot.exists() && neighbourSnapshot.data().deviceID && neighbourSnapshot.data().canSell) {
                    await toggleDeviceSwitch(neighbourSnapshot.data().deviceID, false);
                }
            });
        }
    }, [deviceStatus, neighbours, personalDeviceID, toggleMode]);

    const toggleDeviceSwitch = async (deviceId, newState, performSecurityCheck = false) => {
        console.log(`Sending command to ${newState ? 'turn on' : 'turn off'} device ID:`, deviceId);
        try {
            const response = await axios.post(`https://us-central1-watt-street.cloudfunctions.net/api/device-action/${deviceId}`, {
                newState: newState,
            });
            console.log("Toggle response:", response.data);

            if (performSecurityCheck) {
                console.log("Performing security checks and toggling seller's device.");
                const seller = sellerSettings.find(seller => seller.deviceID !== deviceId);
                if (seller) {
                    await toggleDeviceSwitch(seller.deviceID, false); 
                }
            }
        } catch (error) {
            console.error('Error toggling switch:', error);
        }
    };

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
                <button
                    className={`switch-button buy ${currentMode === 'buy' ? 'active' : ''}`}
                    onClick={() => handleToggleMode('buy')}
                >
                    Buy
                </button>

                {canSell && (
                    <button
                        className={`switch-button sell ${currentMode === 'sell' ? 'active' : ''}`}
                        onClick={() => handleToggleMode('sell')}
                    >
                        Sell Power
                    </button>
                )}
                <button
                    className={`switch-button off ${currentMode === 'off' ? 'active' : ''}`}
                    onClick={() => {
                        setDeviceStatus('off');
                        handleToggleMode('off');
                    }}
                >
                    Off
                </button>
            </div>
            <div className="sellers-list">
                {sellerSettings.length > 0 ? sellerSettings.map((seller, index) => (
                    <div className="seller-info" key={index}>
                        <h3>{seller.name} ({seller.email})</h3>
                        <ul>
                            {seller.energyData && Array.isArray(seller.energyData) ? seller.energyData.map((data, idx) => (
                                <li key={idx}>{data.date}: {data.usage} kWh</li>
                            )) : <li>No energy data available.</li>}
                        </ul>
                    </div>
                )) : <p className="no-sellers">No sellers available.</p>}
            </div>
        </div>
    );
}

export default ModeSelector;
