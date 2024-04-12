import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import '../scss/energyStatistics.scss';
import NavBar from './navbar';
import NavBar2 from './computerNav';
import SpeedometerGauge from './speedometer';
import KwhGraph from './kwhGraph';

function Dashboard() {
  const navigate = useNavigate();
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [deviceStatus, setDeviceStatus] = useState({ switch: false });
  const [deviceData, setDeviceData] = useState({
    amps: '0 A',
    kW: '0 kW',
    volts: '0 V',
    totalForwardEnergy: '0 kWh',
    batteryPercentage: '0%',
    dailyEnergyUsage: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
  });
  const [deviceID, setDeviceID] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { amps, kW, volts, totalForwardEnergy, batteryPercentage, dailyEnergyUsage } = deviceData;

  useEffect(() => {
    window.addEventListener('resize', () => setScreenWidth(window.innerWidth));
    return () => window.removeEventListener('resize', () => setScreenWidth(window.innerWidth));
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/');
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) return console.log('No user document found');
      setDeviceID(userDoc.data().deviceID);
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!deviceID) return;
    const interval = setInterval(() => fetchDeviceStatus(), 1500);
    return () => clearInterval(interval);
  }, [deviceID]);

  const fetchDeviceStatus = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://us-central1-watt-street.cloudfunctions.net/api/device-status/${deviceID}`);
      const { data } = response;
      console.log("API Response:", data); // Debugging output
      processDeviceData(data.result);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch device status:', error);
      setIsLoading(false);
    }
  };

  function getDayOfWeek(timestamp) {
    const date = new Date(timestamp * 1000); // Convert UNIX timestamp to JavaScript Date object
    return date.toLocaleDateString('en-US', { weekday: 'short' }); // 'short' gives you the abbreviated day of the week
  }

  const processDeviceData = (data) => {
    let newState = { ...deviceData };
    data.forEach(item => {
      switch (item.code) {
        case 'total_forward_energy':
          const formattedEnergy = (item.value / 100).toFixed(2);
          newState.totalForwardEnergy = `${formattedEnergy} kWh`;
          newState.batteryPercentage = `${(parseFloat(formattedEnergy) / 14.3 * 100).toFixed(2)}%`;
          break;
        case 'phase_a':
          const { voltage, current, power } = decodePhaseAData(item.value);
          newState.amps = `${current} A`;
          newState.kW = `${power} kW`;
          newState.volts = `${voltage} V`;
          break;
        case 'switch':
          newState.deviceStatus = { ...newState.deviceStatus, switch: item.value };
          break;
        case 'energy_usage':
          updateDailyUsage(getDayOfWeek(item.timestamp), item.power, item.duration, newState);
          break;
        default:
          break;
      }
    });
    setDeviceData(newState);
  };

  const updateDailyUsage = (day, powerInWatts, durationInMinutes, newState) => {
    const kwhUsed = calculateKwh(powerInWatts, durationInMinutes);
    newState.dailyEnergyUsage[day] = parseFloat((newState.dailyEnergyUsage[day] + kwhUsed).toFixed(4));
  };

  const calculateKwh = (powerInWatts, durationInMinutes) => {
    return (powerInWatts * (durationInMinutes / 60)) / 1000; // Convert to kWh
  };

  const decodePhaseAData = (encodedData) => {
    const rawData = atob(encodedData);
    const data = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      data[i] = rawData.charCodeAt(i);
    }
    const voltage = ((data[0] << 8) | data[1]) / 10;
    const current = ((data[2] << 16) | (data[3] << 8) | data[4]) / 1000;
    const power = ((data[5] << 16) | (data[6] << 8) | data[7]) / 1000 * 1000;
    return { voltage, current, power };
  };

  const toggleDeviceSwitch = async () => {
    setIsLoading(true);
    try {
      const newState = !deviceStatus.switch;
      await axios.post(`https://us-central1-watt-street.cloudfunctions.net/api/device-action/${deviceID}`, { newState });
      setDeviceStatus({ ...deviceStatus, switch: newState });
      setIsLoading(false);
    } catch (error) {
      console.error('Error toggling switch:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className='dashcontainer'>
      {screenWidth < 820 ? <NavBar /> : <NavBar2 />}
      <div className='card'>
        <div className="measurements-container">
          <div className="measurement-box">
            <SpeedometerGauge currentWatts={parseFloat(kW)} maxWatts={1500} />
            <KwhGraph totalForwardEnergy={dailyEnergyUsage} />
            <div className="measurement-box">
              <span>kWh:</span>
              <div className="graph-bar"><div className="graph-value" style={{ width: `${parseFloat(kW) / 1500 * 100}%` }}></div></div>
              <span>{totalForwardEnergy}</span>
              <span>Battery Usage: {batteryPercentage}</span>
            </div>
          </div>
        </div>
        <div className="toggle-wrapper">
          <input className="toggle-checkbox" type="checkbox" checked={deviceStatus.switch} onChange={toggleDeviceSwitch} />
          <div className="toggle-container">  
            <div className="toggle-button">
              {Array.from({ length: 12 }).map((_, idx) => <div key={idx} className="toggle-button-circle"></div>)}
            </div>
            <span>{deviceStatus.switch }</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
