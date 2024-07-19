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
    const { deviceStatus, updateDeviceID, fetchDeviceStatus, toggleDeviceSwitch } = useDevice();
    const navigate = useNavigate();
    const [homeAssistantBattery, setHomeAssistantBattery] = useState('');
    const [userId, setUserId] = useState('');
    const [mode, setMode] = useState('off'); // State to store the mode

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    useEffect(() => {
        const interval = setInterval(fetchDeviceStatus, 2000);
        return () => clearInterval(interval);
    }, [fetchDeviceStatus]);

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

    return (
        <div className='dashcontainer'>
            {/* {screenWidth < 820 ? <ProfileNavBar userId={userId} /> : <NavBar2 />} */}
            <ProfileNavBar userId={userId} />
            <div className='card'>
                <ModeSelector 
                    toggleMode={(newMode) => {
                        const userRef = doc(db, 'users', auth.currentUser?.uid);
                        updateDoc(userRef, { mode: newMode }).then(() => {
                            console.log("Mode updated successfully!");
                            setMode(newMode); // Update local mode state
                        })
                            .catch(error => console.error("Failed to update mode:", error));
                    }} 
                    deviceStatus={deviceStatus}
                    toggleDeviceSwitch={toggleDeviceSwitch}
                />
                {/* <h2>Home Assistant Battery Percentage</h2>
                <p>{homeAssistantBattery}</p> */}
                <div className='measurements-container'>
                    <div className="measurement-box">
                        <SpeedometerGauge currentWatts={parseFloat(deviceStatus.kW)} maxWatts={deviceStatus.nominalVoltage * deviceStatus.maxChargeCurrent / 1000} mode={mode} /> {/* Pass mode as a prop */}
                    </div>
                    <div className="measurement-box">
                        <span>Your Energy Total!</span>
                        <div className="graph-bar"><div className="graph-value" style={{ width: `${parseFloat(deviceStatus.totalForwardEnergy) / deviceStatus.totalCapacity * 100}%` }}></div></div>
                        <span>used {deviceStatus.totalForwardEnergy} from neighbours!</span>
                    </div>
                </div>
                <div className="measurement-box">
                    <KWhGraph />
                    <EarningsGraph/>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
