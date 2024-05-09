import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from '../firebase-config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import '../scss/energyStatistics.scss';
import NavBar from './navbar';
import NavBar2 from './computerNav';
import SpeedometerGauge from './speedometer';
import ModeSelector from './buy@sell';
import { useDevice } from '../context/deviceContext';
import KWhGraph from './theGraph';

function Dashboard() {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const { deviceStatus, updateDeviceID, fetchDeviceStatus, toggleDeviceSwitch } = useDevice();
    const navigate = useNavigate();
    const [homeAssistantBattery, setHomeAssistantBattery] = useState('');

    useEffect(() => {
        window.addEventListener('resize', () => setScreenWidth(window.innerWidth));
        return () => window.removeEventListener('resize', () => setScreenWidth(window.innerWidth));
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    updateDeviceID(userDoc.data().deviceID);
                } else {
                    console.log('No user document found');
                    navigate('/');
                }
            }
        };
        fetchUserData();
    }, [auth, db, navigate, updateDeviceID]);

    useEffect(() => {
        const interval = setInterval(fetchDeviceStatus, 2000);
        return () => clearInterval(interval);
    }, [fetchDeviceStatus]);

    useEffect(() => {
        const fetchBatteryPercentage = async () => {
            try {
                // Using Axios to make a GET request to your Firebase function
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
            {screenWidth < 820 ? <NavBar /> : <NavBar2 />}
            <ModeSelector 
                toggleMode={(newMode) => {
                    const userRef = doc(db, 'users', auth.currentUser?.uid);
                    updateDoc(userRef, { mode: newMode }).then(() => console.log("Mode updated successfully!"))
                        .catch(error => console.error("Failed to update mode:", error));
                }} 
                deviceStatus={deviceStatus}
                toggleDeviceSwitch={toggleDeviceSwitch}
            />
            <div className='card'>
                <h2>Home Assistant Battery Percentage</h2>
                <p>{homeAssistantBattery}</p>
                <div className='measurements-container'>
                    <div className="measurement-box">
                        <SpeedometerGauge currentWatts={parseFloat(deviceStatus.kW)} maxWatts={deviceStatus.nominalVoltage * deviceStatus.maxChargeCurrent / 1000} />
                    </div>
                    <div className="measurement-box">
                        <span>Your Energy Total!</span>
                        <div className="graph-bar"><div className="graph-value" style={{ width: `${parseFloat(deviceStatus.totalForwardEnergy) / deviceStatus.totalCapacity * 100}%` }}></div></div>
                        <span>used {deviceStatus.totalForwardEnergy} from neighbours!</span>
                    </div>
                    <div className="measurement-box">
                  <KWhGraph />
              </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
