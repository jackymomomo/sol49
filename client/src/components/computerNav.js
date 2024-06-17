import '../scss/computerNav.scss';
import logo from '../assets/sol49logo.png'; // Path to your logo file
import ProfileNavBar from './profilenavbar';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../scss/profilenav.scss'; // Ensure styles are properly referenced

const NavBar2 = ({ userId }) => {
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


    // Items for the navigation bar
    const menuItems = [
        { name: 'Home', link: '/dashboard', dataItem: 'Home' },
        // { name: 'Connections', link: '/friends', dataItem: 'Connections' },
        // { name: 'History', link: '/history', dataItem: 'History' },
        { name: 'Profile', link: '/editprofile', dataItem: 'Profile' },
        // { name: 'Settings', link: '/settings', dataItem: 'Settings' },
    ];

    return (
        <div className="navBar2-container">
            <div>
                <a href='https://sol49.com'>
                    {/* <p data-item='Sol49'>Sol49</p> */}
                    {/* <img className='logo-image' src={logo} alt="Sol49 Logo" />  */}
                </a>
                <ProfileNavBar/>
                <section>
                    <nav>
                        <ul className="menuItems">
                            {menuItems.map((item, index) => (
                                <li key={index}>
                                    <a 
                                        href={item.link} 
                                        data-item={item.dataItem}
                                        onMouseEnter={() => setHoverText(item.dataItem)}
                                        onMouseLeave={() => setHoverText('')}
                                    >
                                        {item.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </section>
            </div>
        </div>
    );
};

export default NavBar2;
