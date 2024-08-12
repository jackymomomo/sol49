import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import { auth, db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';

const DeviceContext = createContext();

export const useDevice = () => useContext(DeviceContext);

export const DeviceProvider = ({ children }) => {
    const [deviceStatus, setDeviceStatus] = useState({
        switch: false,
        amps: '0 A',
        kW: '0 kW',
        volts: '0 V',
        totalForwardEnergy: '0 kWh',
        batteryPercentage: '0%'
    });
    const [deviceID, setDeviceID] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const updateDeviceID = useCallback((id) => {
        setDeviceID(id);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().deviceID) {
                    updateDeviceID(userDoc.data().deviceID);
                } else {
                    console.log('No user document or device ID found');
                }
            }
        };
        fetchUserData();
    }, [updateDeviceID]);

    function decodePhaseAData(encodedData) {
        const rawData = atob(encodedData); // Base64 decode
        const data = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i++) {
            data[i] = rawData.charCodeAt(i);
        }
        const voltage = ((data[0] << 8) | data[1]) / 10;
        const current = ((data[2] << 16) | (data[3] << 8) | data[4]) / 1000;
        const power = ((data[5] << 16) | (data[6] << 8) | data[7]) / 1000;
        return { voltage, current, power };
    }

    const fetchDeviceStatus = useCallback(async () => {
        if (!deviceID) {
            console.error("No device ID available.");
            return;
        }
    
        setIsLoading(true);
        try {
            const response = await axios.get(`https://us-central1-watt-street.cloudfunctions.net/api/device-status/${deviceID}`);
            const results = response.data.result;
            let newStatus = { ...deviceStatus };
    
            // Fetch the TFE reset offset from Firestore
            const userRef = doc(db, 'users', auth.currentUser?.uid);
            const userDoc = await getDoc(userRef);
            const tfeResetOffset = userDoc.exists() ? parseFloat(userDoc.data().tfeResetOffset || '0') : 0;
    
            const phaseAObj = results.find(d => d.code === 'phase_a');
            if (phaseAObj && phaseAObj.value) {
                const phaseAData = decodePhaseAData(phaseAObj.value);
                newStatus.amps = `${phaseAData.current} A`;
                newStatus.kW = `${phaseAData.power} kW`;  // Adjusted to show power in kW
                newStatus.volts = `${phaseAData.voltage} V`;
            }
    
            const energyObj = results.find(d => d.code === 'total_forward_energy');
            if (energyObj && energyObj.value) {
                const rawTFE = parseFloat(energyObj.value) / 100; // Assuming it's in Wh
                const adjustedTFE = (rawTFE - tfeResetOffset).toFixed(2);
                newStatus.totalForwardEnergy = `${adjustedTFE} kWh`;
                newStatus.batteryPercentage = ((adjustedTFE / 14.3) * 100).toFixed(2) + '%';
            }
    
            const switchObj = results.find(d => d.code === 'switch');
            if (switchObj) {
                newStatus.switch = switchObj.value;
            }
    
            setDeviceStatus(newStatus);
        } catch (error) {
            console.error('Failed to fetch device status:', error);
        } finally {
            setIsLoading(false);
        }
    }, [deviceID, deviceStatus]);
    
    const toggleDeviceSwitch = async (deviceID, newState) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`https://us-central1-watt-street.cloudfunctions.net/api/device-action/${deviceID}`, { newState });
            if (response.data.success) {
                setDeviceStatus((prevStatus) => ({ ...prevStatus, switch: newState }));
            }
        } catch (error) {
            console.error('Error toggling device switch:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DeviceContext.Provider value={{
            deviceStatus,
            setDeviceStatus,
            deviceID,
            updateDeviceID,
            isLoading,
            fetchDeviceStatus,
            toggleDeviceSwitch
        }}>
            {children}
        </DeviceContext.Provider>
    );
};
