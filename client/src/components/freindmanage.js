import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase-config';

function FriendRequests() {
    const [friendRequests, setFriendRequests] = useState([]);
    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
  
    const getUserNameById = async (userId) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          return userSnap.data().name; // Ensure 'name' is the correct field
        } else {
          console.log(`User not found: ${userId}`);
          return 'Unknown User'; // Fallback if the user document doesn't exist
        }
      };

      useEffect(() => {
        const fetchFriendRequests = async () => {
          if (!currentUserId) return;
    
          const q = query(collection(db, 'friendRequests'), where('receiverId', '==', currentUserId), where('status', '==', 'pending'));
          try {
            const querySnapshot = await getDocs(q);
            const requestsWithNamesPromises = querySnapshot.docs.map(async (doc) => {
              const senderName = await getUserNameById(doc.data().senderId);
              return { id: doc.id, ...doc.data(), senderName };
            });
            const requestsWithNames = await Promise.all(requestsWithNamesPromises);
            setFriendRequests(requestsWithNames);
          } catch (error) {
            console.error("Error fetching friend requests: ", error);
          }
        };
    
        fetchFriendRequests();
      }, [currentUserId]);


  const handleAccept = async (requestId, senderId) => {
    // Update the friend request status to 'accepted'
    const requestRef = doc(db, 'friendRequests', requestId);
    await updateDoc(requestRef, {
      status: 'accepted'
    });
  
    // Fixed paths for creating friends subcollection documents
    const currentUserFriendRef = doc(db, 'users', currentUserId, 'friends', senderId); // Use senderId as doc ID
    const senderFriendRef = doc(db, 'users', senderId, 'friends', currentUserId); // Use currentUserId as doc ID
  
    // Add the sender as a friend to the current user's friend list
    await setDoc(currentUserFriendRef, { friendId: senderId });
  
    // Add the current user as a friend to the sender's friend list
    await setDoc(senderFriendRef, { friendId: currentUserId });
  
    alert('Friend request accepted!');
  };
  
  

  const handleDecline = async (requestId) => {
    // Option 1: Update the friend request status to 'declined'
    const requestRef = doc(db, 'friendRequests', requestId);
    await updateDoc(requestRef, {
      status: 'declined'
    });
  
    alert('Friend request declined.');
  };
  

  return (
    <div>
      <h2>Incoming Friend Requests</h2>
      <ul>
        {friendRequests.length > 0 ? (
          friendRequests.map((request) => (
            <li key={request.id}>
              {request.senderName} {/* Trying to Display the sender's name but failing miserably */}
              <button onClick={() => handleAccept(request.id, request.senderId)}>Accept</button>
              <button onClick={() => handleDecline(request.id)}>Decline</button>
            </li>
          ))
        ) : (
          <p>No incoming friend requests.</p>
        )}
      </ul>
    </div>
  );
}

export default FriendRequests;