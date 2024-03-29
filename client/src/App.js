import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase-config'; // Ensure you have the correct path
import AuthForm from './components/login.js';
import Dashboard from './components/dashboard.js';
import AddFriends from './components/friendAdd.js';
import AdditionalUserInfo from './components/extraGoogleUserInfo.js';
import UserProfile from './components/userprofile.js';
import Settings from './components/settings.js';

function App() {
  const [currentUser, setCurrentUser] = useState(null); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });

    return () => unsubscribe(); // Cleanup the subscription
  }, []);

  const ProtectedRoute = ({ children }) => {
    return currentUser ? children : <Navigate to="/" />;
  };

  serviceWorkerRegistration.register();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/friends" element={
          <ProtectedRoute>
            <AddFriends />
          </ProtectedRoute>
        } />
        <Route path="/additional-info" element={
          <ProtectedRoute>
            <AdditionalUserInfo />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/editprofile" element={ // Add the UserProfile component as a protected route
          <ProtectedRoute>
            <UserProfile userId={currentUser?.uid} />
          </ProtectedRoute>
        } />
        {/* Redirect unknown paths to AuthForm or a specific "NotFound" component */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
