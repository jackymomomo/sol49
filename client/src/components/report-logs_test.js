import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // If you're using react-router
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';

const ReportLogsTest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook for navigation
  const baseUrl = "https://us-central1-watt-street.cloudfunctions.net/api";

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          return userDocSnap.data().deviceID;
        } else {
          console.log('No user document found');
          navigate('/'); // Redirect if no user document is found
        }
      } else {
        navigate('/login'); // Redirect if there is no signed-in user
      }
    };

    fetchUserData().then((deviceID) => {
      if (deviceID) {
        fetchEnergyHistory(deviceID);
      }
    });
  }, [navigate]);

  const fetchEnergyHistory = async (deviceId) => {
    setLoading(true);
    setError(null);

    try {
      console.log('device-id:', deviceId);
      const response = await axios.get(`${baseUrl}/report-logs/${deviceId}`, {
        params: {
          codes: 'phase_a',
          startTime: '0', // Start timestamp
          endTime: '1713474246300', // End timestamp
          size: 100  // Number of logs to retrieve
        }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching energy history:', err);
      setError('Failed to fetch energy history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Device Energy History</h1>
      <button onClick={fetchEnergyHistory}>
        Fetch Energy History
      </button>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};

export default ReportLogsTest;
