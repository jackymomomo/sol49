import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase-config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { getTimeZones } from '@vvo/tzdb';
import '../scss/editprofile.scss';
import NavBar from './navbar';
import NavBar2 from './computerNav';

const UserProfile = ({ userId }) => {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [deviceID, setDeviceID] = useState('');
    const [timeZone, setTimeZone] = useState(''); // Initialize with an empty string or a default value
    const [profileImage, setProfileImage] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const timeZones = getTimeZones(); // Fetch time zone data from @vvo/tzdb

    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
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
                setTimeZone(userData.timeZone || timeZones[0].name); // Default to the first time zone if not set
                setProfileImageUrl(userData.profileImageUrl || '');
            } else {
                console.log('No such document!');
            }
        };
        fetchUserData();
    }, [userId]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setProfileImage(e.target.files[0]);
            setProfileImageUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        let imageUrl = profileImageUrl;
        if (profileImage) {
            const imageRef = ref(storage, `profileImages/${userId}/${profileImage.name}`);
            const snapshot = await uploadBytes(imageRef, profileImage);
            imageUrl = await getDownloadURL(snapshot.ref);
        }
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            name,
            email,
            address,
            phoneNumber,
            deviceID,
            timeZone,
            profileImageUrl: imageUrl,
        });
        console.log('User profile updated successfully');
        navigate('/dashboard');
    };

    return (
        <div>
        { screenWidth < 820 ? <NavBar/> : <NavBar2/>}
        <div className="user-profile-container">
            <h2>Edit Profile</h2>
            {/* Display the profile image if available */}
            {profileImageUrl && (
                <img src={profileImageUrl} alt="Profile" className="profile-image-preview" />
            )}
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
                <div className="form-field">
                    <label htmlFor="profileImage" className="label-name"><span className="content-name">Profile Image</span></label>
                    <input type="file" id="profileImage" onChange={handleFileChange} />
                </div>
                <div className="form-field">
                    <select id="timeZone" required value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
                        {timeZones.map((tz) => (
                            <option key={tz.name} value={tz.name}>{tz.name} (UTC{tz.rawOffsetInMinutes / 60})</option>
                        ))}
                    </select>
                    <label htmlFor="timeZone" className="label-name"><span className="content-name"></span></label>
                </div>
                <button type="submit" className="form-submit-button">Update Profile</button>
            </form>
        </div>
        </div>
    );
};

export default UserProfile;
