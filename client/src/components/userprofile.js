import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase-config'; // Adjust the import path as needed. Ensure 'storage' is exported from your firebase-config.
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import storage functions
import { useNavigate } from 'react-router-dom';
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
    const [profileImage, setProfileImage] = useState(null); // State for the profile image file
    const [profileImageUrl, setProfileImageUrl] = useState(''); // State to hold the temporary URL for preview

    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
    
        // Cleanup function to remove event listener
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
                // Optionally, you can also fetch and set the image URL if it exists
                // Set the profile image URL if it exists for displaying
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
            // Generate a URL for the file to preview the image
            setProfileImageUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            let imageUrl = profileImageUrl; // Use existing image URL by default
            if (profileImage) {
                const imageRef = ref(storage, `profileImages/${userId}/${profileImage.name}`);
                const snapshot = await uploadBytes(imageRef, profileImage);
                imageUrl = await getDownloadURL(snapshot.ref); // Update with the new image URL
            }
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, {
                name,
                email,
                address,
                phoneNumber,
                deviceID,
                profileImageUrl: imageUrl, // Save the new image URL in Firestore
            });
            console.log('User profile updated successfully');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error updating user profile:', error.message);
        }
    };

    return (
        <div>
        { screenWidth < 768 ? <NavBar/> : <NavBar2/>}
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
                <button type="submit" className="form-submit-button">Update Profile</button>
            </form>
        </div>
        </div>
    );
};

export default UserProfile;
