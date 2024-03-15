import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase-config';
import { doc, setDoc } from 'firebase/firestore';

function AdditionalUserInfo() {
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [deviceID, setDeviceID] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = location.state; // Assuming you're passing this state from the redirect

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await setDoc(doc(db, 'users', userId), {
                address,
                phoneNumber,
                deviceID,
            }, { merge: true }); // Use merge option to update or create the document without overwriting existing fields

            console.log('Additional user info saved');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error saving additional info:', error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <input type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            <input type="text" placeholder="Device ID" value={deviceID} onChange={(e) => setDeviceID(e.target.value)} />
            <button type="submit">Submit</button>
        </form>
    );
}

export default AdditionalUserInfo;
