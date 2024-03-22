import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from '../firebase-config'; // Make sure you import your Firebase auth and db
import { doc, getDoc } from 'firebase/firestore';
import '../styles/EnergyStatistics.css';
import NavBar from './navbar';


  function Dashboard() {
    const [amps, setAmps] = useState('0 A');
    const [kW, setKW] = useState('0 kW');
    const [volts, setVolts] = useState('0 V');
    const [totalForwardEnergy, setTotalForwardEnergy] = useState('0 kWh');
    const [batteryPercentage, setBatteryPercentage] = useState('0');
    const [deviceStatus, setDeviceStatus] = useState({ switch: false });
    const [deviceID, setDeviceID] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const totalCapacity = 14.3; // Total capacity of the battery in kWh
    const nominalVoltage = 1503.6; // Nominal voltage in V
    const maxChargeCurrent = 2000; // Max charge current in A
    // Calculate the percentages
    const kWhPercentage = (parseFloat(totalForwardEnergy) / totalCapacity) * 100;
    const ampsPercentage = (parseFloat(amps) / maxChargeCurrent) * 100;
    const voltsPercentage = (parseFloat(volts) / nominalVoltage) * 100;
    // kW calculation depends on how you are determining kW in your application
    const kWPercentage = (parseFloat(kW) / (nominalVoltage * maxChargeCurrent / 1000)) * 100;
    
    const navigate = useNavigate();

    useEffect(() => {
      const fetchUserData = async () => {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            // Set the device ID from the user's document
            setDeviceID(userDoc.data().deviceID);
          } else {
            // Handle case where user document doesn't exist (e.g., redirect or show an error)
            console.log('No user document found');
          }
        } else {
          // Redirect or handle the case where there is no signed-in user
          navigate('/'); // Example redirection
        }
      };
    
      fetchUserData();
    }, []); // This effect is only for fetching user data on component mount.
    
    useEffect(() => {
      // Only set up polling if deviceID is available
      if (deviceID) {
        const interval = setInterval(() => {
          fetchDeviceStatus();
        }, 1500);
    
        return () => clearInterval(interval);
      }
    }, [deviceID]); // This effect depends on deviceID, it will re-run when deviceID changes.
    

    function decodePhaseAData(encodedData) {
      // Decode base64 to byte array
      const rawData = atob(encodedData);
      const data = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        data[i] = rawData.charCodeAt(i);
      }

      // Extract and convert data
      const voltage = ((data[0] << 8) | data[1]) / 10; // Voltage in volts
      const current = ((data[2] << 16) | (data[3] << 8) | data[4]) / 1000 ; // Current in amps
      const power = ((data[5] << 16) | (data[6] << 8) | data[7]) / 1000 * 1000; // Power in kW

      return { voltage, current, power };
    }

    const fetchDeviceStatus = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://192.168.1.110:3001/device-status/${deviceID}`);
        const results = response.data.result;

        const totalForwardEnergyObj = results.find(
          (d) => d.code === 'total_forward_energy'
        );
        if (totalForwardEnergyObj) {
          const energy = totalForwardEnergyObj.value;
          const formattedEnergy = (energy / 100).toFixed(2); // Keep it as numeric for calculation
          const batteryCapacityPercentage = ((parseFloat(formattedEnergy) / 14.3) * 100).toFixed(2);
          setTotalForwardEnergy(`${formattedEnergy} kWh`); // Update totalForwardEnergy as usual
          setBatteryPercentage(`${batteryCapacityPercentage}%`); // Update battery percentage
        }
       
        const phaseAObj = results.find((d) => d.code === 'phase_a');
        if (phaseAObj) {
          const phaseAData = decodePhaseAData(phaseAObj.value);
          setAmps(`${phaseAData.current} A`);
          setKW(`${phaseAData.power} kW`);
          setVolts(`${phaseAData.voltage} V`);
        }

        const switchObj = results.find((d) => d.code === 'switch');
        if (switchObj) {
          const switchState = switchObj.value;
          setDeviceStatus({ ...deviceStatus, switch: switchState });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch device status:', error);
        setIsLoading(false);
      }
    };

    const toggleDeviceSwitch = async () => {
      setIsLoading(true);
      try {
        const currentSwitchState = deviceStatus?.switch;
        await axios.post(`http://192.168.1.110:3001/device-action/${deviceID}`, {
          newState: !currentSwitchState,
        });
        setDeviceStatus({ ...deviceStatus, switch: !currentSwitchState });
        setIsLoading(false);
      } catch (error) {
        console.error('Error toggling switch:', error);
        setIsLoading(false);
      }
    };

    return (
      <div>
        <NavBar/>
      <div className='card'>
      <h2>Energy Measurements</h2>
      <div className="measurements-container">
      <div className="measurement-box">
        <span>Watts:</span>
        <div className="graph-bar"><div className="graph-value" style={{  width: `${kWPercentage}%` }}>
           {kW}</div></div>
      </div>
      <div className="measurement-box">
        <span>kWh:</span>
        <div className="graph-bar"><div className="graph-value"  style={{  width: `${kWhPercentage}%` }}></div></div>
        <span>{totalForwardEnergy}</span>
        <span>Battery Usage: {batteryPercentage}</span>
      </div>
      <div className="measurement-box">
      <span>Amps:</span>
        <div className="graph-bar"><div className="graph-value" style={{  width: `${ampsPercentage}%`}}></div></div>
        <span>{amps}</span>
      </div>
      <div className="measurement-box">
        <span>Volts:</span>
        <div className="graph-bar"><div className="graph-value" style={{  width: `${voltsPercentage}%` }}></div></div>
        <span>{volts}</span>
      </div>
</div>
        <div className="toggle-wrapper">
          <input className="toggle-checkbox" type="checkbox" checked={deviceStatus?.switch} onClick={toggleDeviceSwitch} />
          <div className="toggle-container">  
            <div className="toggle-button">
              <div className="toggle-button-circles-container">
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
                <div className="toggle-button-circle"></div>
              </div>
            </div>
            <span>{deviceStatus?.switch}</span>
          </div>
        </div>
          </div>
      </div>
    );
  }

export default Dashboard;