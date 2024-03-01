import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

function Dashboard() {
  const navigate = useNavigate();

  // Dummy data for display
  const data = {
    amps: '10 A',
    kWh: '5 kWh',
    kW: '2 kW',
    volts: '220 V'
  };

  // Function to "fetch" data, here we just log to the console
  const fetchData = () => {
    console.log("Fetching data...");
    // This is where you would fetch data from the API
  };

  // Function to handle adding friends, for now we'll just log to the console
  const addFriends = () => {
    console.log("Navigating to add friends...");
    navigate('/freinds'); // Navigate to the dashboard
  };

  return (
    <div>
      <h2>Energy Measurements</h2>
      <ul>
        <li>Amps: {data.amps}</li>
        <li>kWh: {data.kWh}</li>
        <li>kW: {data.kW}</li>
        <li>Volts: {data.volts}</li>
      </ul>
      <button onClick={fetchData}>Fetch Data</button>
      <button onClick={() => navigate("/")}>Sign Out</button>
      {/* Add a new button for adding friends */}
      <button onClick={addFriends}>Add Friends</button>
    </div>
  );
}

export default Dashboard;
