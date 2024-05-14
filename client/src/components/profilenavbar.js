// ProfileNavBar.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../scss/profilenav.scss'; // Make sure to create appropriate styles

const ProfileNavBar = ({ userId }) => {
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfileImage = async () => {
            if (userId) {
                const userDocRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setProfileImageUrl(userData.profileImageUrl || '');
                }
            }
        };
        fetchProfileImage();
    }, [userId]);

    return (
        <div className="profile-navbar" onClick={() => navigate('/editprofile')}>
            {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="profile-navbar-image" />
            ) : (
                <div className="profile-placeholder">Profile</div> // Placeholder if no image
            )}
        </div>
    );
};

export default ProfileNavBar;
