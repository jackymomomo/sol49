import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from '../firebase-config';
import { doc, getDoc, updateDoc, collection, query, where, addDoc, getDocs } from 'firebase/firestore';
import '../scss/energyStatistics.scss';
import NavBar from './navbar';
import NavBar2 from './computerNav';
import SpeedometerGauge from './speedometer';
import KwhGraph from './theGraph';
import ModeSelector from './buy@sell';
import { useDevice } from '../context/deviceContext'

function Dashboard() {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const { deviceStatus, updateDeviceID, fetchDeviceStatus, toggleDeviceSwitch } = useDevice();
  const [sellerSettings, setSellerSettings] = useState([]);
  const navigate = useNavigate();

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


  function decodePhaseAData(encodedData) {
    const rawData = atob(encodedData);
    const data = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        data[i] = rawData.charCodeAt(i);
    }
    const voltage = ((data[0] << 8) | data[1]) / 10; // Convert to volts
    const current = ((data[2] << 16) | (data[3] << 8) | data[4]) / 1000; // Convert to amperes
    const power = ((data[5] << 16) | (data[6] << 8) | data[7]); // Convert to watts without scaling factor?
    return { voltage, current, power };
}

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
              <h2>Energy Measurements</h2>
              <div className="measurements-container">
              <div className="measurement-box">
    <SpeedometerGauge currentWatts={parseFloat(deviceStatus.kW)} maxWatts={deviceStatus.nominalVoltage * deviceStatus.maxChargeCurrent / 1000} />
</div>

                  <div className="measurement-box">
                      <span>Your Energy Total!</span>
                      <div className="graph-bar"><div className="graph-value" style={{ width: `${parseFloat(deviceStatus.totalForwardEnergy) / deviceStatus.totalCapacity * 100}%` }}></div></div>
                      <span>used {deviceStatus.totalForwardEnergy} from neighbours!</span>
                  </div>
              </div>
              <div className="measurement-box">
                  <KwhGraph />
              </div>
          </div>
      </div>
  );
}

export default Dashboard;