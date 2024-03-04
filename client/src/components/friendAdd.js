import React, { useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase-config'; // Ensure this path matches your project structure
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

function AddFriends() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    const usersRef = collection(db, 'users');
    // Adjust the query to search by name
    const q = query(usersRef, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.log("No matching documents.");
            setSearchResults([]);
            return;
        }

        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Search results:", results);
        setSearchResults(results);
    } catch (error) {
        console.error("Error fetching documents: ", error);
    }
};


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
    // This step is skipped here for brevity but consider implementing it

    await addDoc(friendRequestsRef, {
      senderId: currentUserId,
      receiverId: receiverId,
      status: 'pending',
      // Timestamps and other fields can be added here
    });
    alert('Friend request sent!');
  };

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by email"
      />
      <button onClick={handleSearch}>Search</button>
      <button onClick={() => navigate('/dashboard')}>Back</button>
      <ul>
        {searchResults.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email} {/* Adjust according to your user data structure */}
            <button onClick={() => sendFriendRequest(user.id)}>Add Friend</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AddFriends;
