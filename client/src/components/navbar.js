import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../scss/navbar.scss';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false); // Initializes state to control the checkbox

  const handleMenuToggle = () => setMenuOpen(!menuOpen); // Toggles the state

  return (
    <div>
      <input
        className="menu-icon"
        type="checkbox"
        id="menu-icon"
        name="menu-icon"
        checked={menuOpen} // Controlled by React's state
        onChange={handleMenuToggle} // Handle change to toggle state
      />
      <label htmlFor="menu-icon"></label>
      <nav className="nav">      
        <ul className="pt-5">
          <li><Link to="/dashboard">Home</Link></li>
          <li><Link to="/friends">Friends</Link></li>
          <li><Link to="/history">History</Link></li>
          <li><Link to="/settings">Settings</Link></li>
          <li><Link to="/editprofile">profile</Link></li>
        </ul>
      </nav>
    </div>
  );
}
