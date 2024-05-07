import { useState, useEffect } from 'react';
import axios from 'axios';
import { doc, updateDoc } from 'firebase/firestore';

function useDeviceControl(auth, db) {
    const [deviceID, setDeviceID] = useState('');
    const [deviceStatus, setDeviceStatus] = useState({ switch: false });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (auth.currentUser) {
            setDeviceID(auth.currentUser.uid); // Assuming device ID is the same as user ID
        }
    }, [auth.currentUser]);

    const fetchDeviceStatus = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`https://us-central1-watt-street.cloudfunctions.net/api/device-status/${deviceID}`);
            const data = response.data;
            setDeviceStatus(data);
        } catch (error) {
            console.error('Failed to fetch device status:', error);
        }
        setIsLoading(false);
    };

    const toggleDeviceSwitch = async () => {
        setIsLoading(true);
        const newState = !deviceStatus.switch;
        try {
            await axios.post(`https://us-central1-watt-street.cloudfunctions.net/api/device-action/${deviceID}`, {
                newState
            });
            setDeviceStatus(prevState => ({ ...prevState, switch: newState }));
        } catch (error) {
            console.error('Error toggling device switch:', error);
        }
        setIsLoading(false);
    };

    return {
        deviceID,
        deviceStatus,
        isLoading,
        fetchDeviceStatus,
        toggleDeviceSwitch
    };
}

export default useDeviceControl;
