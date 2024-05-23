import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../scss/profilenav.scss'; // Ensure styles are properly referenced
import logo from '../assets/sol49logo.png'; // Path to your logo file

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

    const handleLogoClick = () => {
        navigate('/dashboard');
    };

    return (
        <div className="navbar">
            <div className="navbar-logo" onClick={handleLogoClick}>
                <img src={logo} alt="Logo" className="logo-image" />
            </div>
            <div className="profile-navbar" onClick={() => navigate('/editprofile')}>
                {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile" className="profile-navbar-image" />
                ) : (
                    <div className="profile-placeholder">Profile</div>
                )}
            </div>
        </div>
    );
};

export default ProfileNavBar;
