import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from '../firebase-config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import '../scss/energyStatistics.scss';
import ProfileNavBar from './profilenavbar';
import NavBar2 from './computerNav';
import SpeedometerGauge from './speedometer';
import ModeSelector from './buy@sell';
import { useDevice } from '../context/deviceContext';
import KWhGraph from './theGraph';
import EarningsGraph from './earningsGraph';

function Dashboard() {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const { deviceStatus, setDeviceStatus, updateDeviceID, fetchDeviceStatus, toggleDeviceSwitch } = useDevice();
    const navigate = useNavigate();
    const [homeAssistantBattery, setHomeAssistantBattery] = useState('');
    const [userId, setUserId] = useState('');
    const [mode, setMode] = useState('off'); // State to store the mode
    const [resetTFE, setResetTFE] = useState(false); // Flag to track if TFE has been reset

    // Handle screen resizing
    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch user data from Firestore and set userId and mode
    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                setUserId(user.uid); // Set userId for ProfileNavBar and fetch data
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    updateDeviceID(userData.deviceID);
                    setMode(userData.mode || 'off'); // Set the mode from Firestore
                } else {
                    console.log('No user document found');
                    navigate('/');
                }
            }
        };
        fetchUserData();
    }, [navigate, updateDeviceID]);

    // Poll the device status periodically, only if TFE has not been reset
    useEffect(() => {
        const interval = setInterval(() => {
            if (!resetTFE) {
                fetchDeviceStatus(); // Fetch status only if TFE has not been reset
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [fetchDeviceStatus, resetTFE]);

    // Fetch Home Assistant Battery Percentage
    useEffect(() => {
        const fetchBatteryPercentage = async () => {
            try {
                const response = await axios.get('https://us-central1-watt-street.cloudfunctions.net/proxyBatteryStatus');
                if (response.data) {
                    setHomeAssistantBattery(response.data.state + '%'); // Adjust according to the actual response format
                }
            } catch (error) {
                console.error('Error fetching battery percentage:', error);
                setHomeAssistantBattery('Error');
            }
        };
        fetchBatteryPercentage();
    }, []);

    const handleResetTFE = async () => {
        const userRef = doc(db, 'users', auth.currentUser?.uid);
        try {
            // Get the current totalForwardEnergy value to store as the offset
            const currentTFE = parseFloat(deviceStatus.totalForwardEnergy);
    
            // Store this offset in Firestore
            await updateDoc(userRef, {
                tfeResetOffset: currentTFE // Save the current TFE as the offset
            });
    
            // Update local device status to reflect the change immediately
            setDeviceStatus(prevState => ({
                ...prevState,
                totalForwardEnergy: '0 kWh' // Set local TFE to zero
            }));
    
            console.log("Total Forward Energy reset successfully!");
        } catch (error) {
            console.error("Failed to reset Total Forward Energy:", error);
        }
    };
    
    return (
        <div className='dashcontainer'>
            {/* Profile Navigation Bar */}
            <ProfileNavBar userId={userId} />
            
            <div className='card'>
                {/* Mode Selector Component */}
                <ModeSelector 
                    toggleMode={(newMode) => {
                        const userRef = doc(db, 'users', auth.currentUser?.uid);
                        updateDoc(userRef, { mode: newMode }).then(() => {
                            console.log("Mode updated successfully!");
                            setMode(newMode); // Update local mode state
                            setResetTFE(false); // Clear the reset flag when mode is toggled
                        })
                            .catch(error => console.error("Failed to update mode:", error));
                    }} 
                    deviceStatus={deviceStatus}
                    toggleDeviceSwitch={toggleDeviceSwitch}
                />

                <div className='measurements-container'>
                    {/* Speedometer Gauge */}
                    <div className="measurement-box">
                        <SpeedometerGauge 
                            currentWatts={parseFloat(deviceStatus.kW)} 
                            maxWatts={deviceStatus.nominalVoltage * deviceStatus.maxChargeCurrent / 1000} 
                            mode={mode} 
                        /> {/* Pass mode as a prop */}
                    </div>

                    {/* Total Forward Energy Display and Reset Button */}
                    <div className="measurement-box">
                        <span>Your Energy Total!</span>
                        <div className="graph-bar">
                            <div className="graph-value" style={{ width: `${parseFloat(deviceStatus.totalForwardEnergy) / deviceStatus.totalCapacity * 100}%` }}></div>
                        </div>
                        <span>used {deviceStatus.totalForwardEnergy} kWh from neighbours!</span>
                        {/* Reset Button */}
                        <button onClick={handleResetTFE}>Reset</button>
                    </div>
                </div>

                {/* Graph Components */}
                <div className="measurement-box">
                    <KWhGraph />
                    <EarningsGraph/>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
