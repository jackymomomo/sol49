import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase-config';

const DeviceEnergyHistory = () => {
  const [deviceID, setDeviceID] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const baseUrl = "https://us-central1-watt-street.cloudfunctions.net/api";

  // Fetch user's deviceID once and store it in state
  useEffect(() => {
    const fetchDeviceID = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setError('No user signed in');
        navigate('/login');
        return;
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().deviceID) {
          setDeviceID(userDocSnap.data().deviceID);
          console.log(`Device ID set: ${userDocSnap.data().deviceID}`);
        } else {
          setError('Device ID not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching device ID:', error);
        setError('Failed to fetch device ID');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceID();
  }, [navigate]);

  // Function to fetch energy history using the device ID
  const fetchEnergyHistory = async () => {
    if (!deviceID) {
      console.error('No device ID available for fetching energy history');
      setError('Device ID is required for fetching energy history');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/report-logs/${deviceID}`, {
        params: {
          codes: 'total_forward_energy',
          startTime: '0', // Start timestamp
          endTime: '1713474246300', // End timestamp
          size: 100  // Number of logs to retrieve
        }
      });
      if (!response.data || !response.data.logs) {
        console.error(`No logs found for device ID: ${deviceID}`);
        setError('No energy data available');
        return;
      }
      console.log(`Energy history data retrieved for device ID: ${deviceID}`, response.data);
    } catch (err) {
      console.error('Error fetching energy history:', err);
      setError(`Failed to fetch energy history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Device Energy History</h1>
      <button onClick={fetchEnergyHistory} disabled={!deviceID || loading}>
        Fetch Energy History
      </button>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {/* Display data or additional content here */}
    </div>
  );
};

export default DeviceEnergyHistory;
