import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import NavBar from './navbar';
import { debounce } from 'lodash'; // Make sure lodash is installed
import FriendRequests from './freindmanage';
import NavBar2 from './computerNav';

function AddFriends() {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    // Cleanup function to remove event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAndFilterUsers = async (searchValue) => {
    if (!searchValue.trim()) {
      setSearchResults([]);
      return;
    }

    const searchValueLowercase = searchValue.trim().toLowerCase();
    const usersRef = collection(db, 'users');
    try {
      const querySnapshot = await getDocs(usersRef);
      const filteredResults = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.name.toLowerCase().includes(searchValueLowercase) || userData.email.toLowerCase().includes(searchValueLowercase)) {
          filteredResults.push({ id: doc.id, ...userData });
        }
      });

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  const sendFriendRequest = async (receiverId) => {
    const currentUserId = auth.currentUser ? auth.currentUser.uid : null; // Correctly get the current user's ID
    if (!currentUserId) {
        console.error("User is not logged in.");
        return;
    }

    if (receiverId === currentUserId) {
        alert("You cannot send a friend request to yourself.");
        return;
    }

    const friendRequestsRef = collection(db, 'friendRequests');
    try {
        await addDoc(friendRequestsRef, {
            senderId: currentUserId,
            receiverId: receiverId,
            status: 'pending',
        });
        alert('Friend request sent!');
    } catch (error) {
        console.error("Error sending friend request: ", error);
        alert('Failed to send friend request.');
    }
};

  // Debounced search to reduce number of executions while typing
  const debouncedSearch = debounce(fetchAndFilterUsers, 500);

  useEffect(() => {
    debouncedSearch(searchTerm);

    return () => debouncedSearch.cancel(); // Cleanup function to cancel the debounced call
  }, [searchTerm]);

  return (
    <div>
      {screenWidth < 768 ? <NavBar/> : <NavBar2/>}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by name or email"
      />
      <ul>
        {searchResults.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
            <button onClick={() => sendFriendRequest(user.id)}>Add Friend</button>
          </li>
        ))}
      </ul>
     <FriendRequests/>
    </div>
  );
}

export default AddFriends;
