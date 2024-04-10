import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase-config';
import AuthForm from './components/login.js';
import Dashboard from './components/dashboard.js';
import AddFriends from './components/friendAdd.js';
import AdditionalUserInfo from './components/extraGoogleUserInfo.js';
import UserProfile from './components/userprofile.js';
import Settings from './components/settings.js';
import NavBar2 from './components/computerNav.js';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // New state to track loading of auth state

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false); // Set loading to false once we get the auth state
    });

    return () => unsubscribe();
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div>Loading...</div>; // Or any other loading indicator
    }

    return currentUser ? children : <Navigate to="/" />;
  };

  if (loading) {
    return <div>Loading...</div>; // Show loading indicator while checking auth state
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><AddFriends /></ProtectedRoute>} />
        <Route path="/additional-info" element={<ProtectedRoute><AdditionalUserInfo /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><NavBar2/></ProtectedRoute>} />
        <Route path="/editprofile" element={<ProtectedRoute><UserProfile userId={currentUser?.uid} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
