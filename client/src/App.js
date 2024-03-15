import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthForm from './components/login.js'
import Dashboard from './components/dashboard.js'; // This will be our new component with dummy data
import DeviceStatusComponent from './components/userData.js';
import AddFriends from './components/friendAdd.js';
import AdditionalUserInfo from './components/extraGoogleUserInfo.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/device-status" element={<DeviceStatusComponent />} />
        <Route path="/freinds" element={<AddFriends />} />
        <Route path="/additional-info" element={<AdditionalUserInfo />} />
      </Routes>
    </Router>
  );
}

export default App;
