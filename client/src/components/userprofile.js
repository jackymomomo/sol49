import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config'; // Adjust the import path as needed
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../scss/editprofile.scss'

const UserProfile = ({ userId }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [deviceID, setDeviceID] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        // Fetch the user's data from Firestore
        const fetchUserData = async () => {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setName(userData.name || '');
                setEmail(userData.email || '');
                setAddress(userData.address || '');
                setPhoneNumber(userData.phoneNumber || '');
                setDeviceID(userData.deviceID || '');
            } else {
                console.log('No such document!');
            }
        };
        fetchUserData();
    }, [userId]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        const userDocRef = doc(db, 'users', userId);
        try {
            await updateDoc(userDocRef, {
                name,
                email,
                address,
                phoneNumber,
                deviceID,
            });
            console.log('User profile updated successfully');
            navigate('/dashboard'); // Navigate to the dashboard or a confirmation page
        } catch (error) {
            console.error('Error updating user profile:', error.message);
        }
    };

    return (
        <div className="user-profile-container">
            <h2>Edit Profile</h2>
            <form onSubmit={handleUpdate} className="user-profile-form">
                <div className="form-field">
                    <input type="text" id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                    <label htmlFor="name" className="label-name"><span className="content-name">Name</span></label>
                </div>
                <div className="form-field">
                    <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    <label htmlFor="email" className="label-name"><span className="content-name">Email</span></label>
                </div>
                <div className="form-field">
                    <input type="text" id="address" required value={address} onChange={(e) => setAddress(e.target.value)} />
                    <label htmlFor="address" className="label-name"><span className="content-name">Address</span></label>
                </div>
                <div className="form-field">
                    <input type="text" id="phoneNumber" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                    <label htmlFor="phoneNumber" className="label-name"><span className="content-name">Phone Number</span></label>
                </div>
                <div className="form-field">
                    <input type="text" id="deviceID" required value={deviceID} onChange={(e) => setDeviceID(e.target.value)} />
                    <label htmlFor="deviceID" className="label-name"><span className="content-name">Device ID</span></label>
                </div>
                <button type="submit" className="form-submit-button">Update Profile</button>
            </form>
        </div>
    );
};

export default UserProfile;
