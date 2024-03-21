import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import '../scss/navbar.scss';

export default function NavBar({type, onClick, click}) {
  return (
    <div>
      <input className="menu-icon" type="checkbox" id="menu-icon" name="menu-icon"/>
      <label htmlFor="menu-icon"></label>
      <nav className="nav">      
        <ul className="pt-5">
          <li><Link to="/dashboard">Home</Link></li> {/* Use Link instead of a */}
          <li><Link to="/friends">Friends</Link></li> {/* Correct the spelling of 'friends' */}
          <li><Link to="/history">History</Link></li>
          <li><Link to="/editprofile">Settings</Link></li>
          <li><Link to="/editprofile">profile</Link></li>
        </ul>
      </nav>
    </div>
  );
}
