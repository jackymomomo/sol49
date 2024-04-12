import React, { useState } from 'react';
import '../scss/computerNav.scss';

const NavBar2 = () => {
  const [hoverText, setHoverText] = useState('');

  // Items for the navigation bar
  const menuItems = [
    { name: 'Home', link: '/dashboard', dataItem: 'Home' },
    { name: 'Connections', link: '/friends', dataItem: 'Connections' },
    // { name: 'History', link: '/history', dataItem: 'History' },
    { name: 'Profile', link: '/editprofile', dataItem: 'Profile' },
    { name: 'Settings', link: '/settings', dataItem: 'Settings' },
  ];

return (
    <div className="navBar2-container">
        <div>
            <a href='https://sol49.com'>
            <p data-item='Sol49'>Sol49</p>
            </a>
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
