import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import NavBar from './navbar';
import { debounce } from 'lodash'; // Make sure lodash is installed
import FriendRequests from './freindmanage';

function AddFriends() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

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

// Function to send a friend request
const sendFriendRequest = async (receiverId) => {
  const currentUserId = 'currentUserId'; // Replace this with the actual current user's ID

  // Prevent sending a friend request to oneself
  if (receiverId === currentUserId) {
    alert("You cannot send a friend request to yourself.");
    return;
  }

  // Firestore path where friend requests are stored
  const friendRequestsRef = collection(db, 'friendRequests');

  // Check for existing friend request or friendship before adding a new request
  // This step is skipped here for simplicity, but you should implement it to avoid duplicate requests

  try {
    await addDoc(friendRequestsRef, {
      senderId: currentUserId,
      receiverId: receiverId,
      status: 'pending', // Initial status of the friend request
      // Timestamps and other fields can be added here
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
      <NavBar />
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
