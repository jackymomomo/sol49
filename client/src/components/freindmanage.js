import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import '../scss/manageFriends.scss';

function FriendRequests() {
  
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('requests'); // State to manage active tab
  const currentUserId = auth.currentUser ? auth.currentUser.uid : null;

  // Define getUserNameById outside of useEffect so it can be reused
  const getUserNameById = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().name; // Ensure this matches the field name in your Firestore
    } else {
      console.log(`User not found: ${userId}`);
      return 'Unknown User';
    }
  };

  const fetchFriends = async () => {
    if (!currentUserId) return;
    const q = query(collection(db, 'users', currentUserId, 'friends'));
    try {
        const querySnapshot = await getDocs(q);
        const friendsPromises = querySnapshot.docs.map(async (docSnapshot) => { // Renamed 'doc' to 'docSnapshot' to avoid conflict
            const friendId = docSnapshot.id; // Using 'docSnapshot' here
            const friendRef = doc(db, 'users', friendId); // 'doc' should be available here if correctly imported
            const friendSnap = await getDoc(friendRef);
            if (friendSnap.exists()) {
                return {
                    id: friendId,
                    ...friendSnap.data(),
                };
            } else {
                console.log(`No user found for ID: ${friendId}`);
                return null;
            }
        });
        const friendsList = (await Promise.all(friendsPromises)).filter(Boolean);
        setFriends(friendsList);
    } catch (error) {
        console.error("Error fetching friends: ", error);
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
    fetchFriends(); // This is now accessible here
  }, [currentUserId]);

  const handleAccept = async (requestId, senderId) => {
    const requestRef = doc(db, 'friendRequests', requestId);
    await updateDoc(requestRef, { status: 'accepted' });
  
    const senderRef = doc(db, 'users', senderId);
    const senderSnap = await getDoc(senderRef);
    const { name, profileImageUrl } = senderSnap.data();
  
    const currentUserFriendRef = doc(db, 'users', currentUserId, 'friends', senderId);
    const senderFriendRef = doc(db, 'users', senderId, 'friends', currentUserId);
  
    // Here, we're making sure to set the correct data structure for the friend document
    await setDoc(currentUserFriendRef, { friendId: senderId, name, profileImageUrl });
    await setDoc(senderFriendRef, { friendId: currentUserId, name, profileImageUrl });
  
    alert('Friend request accepted!');
  
    // Re-fetch friends to update the list
    await fetchFriends();
  };
  
  
  

  const handleDecline = async (requestId) => {
    // Option 1: Update the friend request status to 'declined'
    const requestRef = doc(db, 'friendRequests', requestId);
    await updateDoc(requestRef, {
      status: 'declined'
    });
  
    alert('Friend request declined.');
  };
  
  const handleDeleteFriend = async (friendId) => {
    // Delete the friend from the current user's friends list
    await deleteDoc(doc(db, 'users', currentUserId, 'friends', friendId));
    
    // Also, delete the current user from the friend's friends list
    await deleteDoc(doc(db, 'users', friendId, 'friends', currentUserId));

    // Refresh the friends list
    await fetchFriends(); // This should now work as expected
    alert('Friend deleted.');
  };


  return (
    <div className="fr-friend-requests">
            <div className="fr-friend-requests__tabs">
                <button
                    className={`fr-friend-requests__tabs__tab ${activeTab === 'requests' ? 'fr-friend-requests__tabs__tab--active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Friend Requests
                </button>
                <button
                    className={`fr-friend-requests__tabs__tab ${activeTab === 'friends' ? 'fr-friend-requests__tabs__tab--active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    My Friends
                </button>
            </div>

            {activeTab === 'requests' && (
  <ul className="fr-friend-requests__list">
    {friendRequests.length > 0 ? friendRequests.map((request) => (
      <li key={request.id} className="fr-friend-requests__item">
        <div className="fr-friend-requests__item__info">
          {request.senderName}
        </div>
        <button onClick={() => handleAccept(request.id, request.senderId)} className="fr-friend-requests__button">Accept</button>
        <button onClick={() => handleDecline(request.id)} className="fr-friend-requests__button">Decline</button>
      </li>
    )) : (
      <p>No incoming friend requests.</p>
    )}
  </ul>
)}

{activeTab === 'friends' && (
  <ul className="fr-friend-requests__list">
    {friends.length > 0 ? friends.map((friend) => (
      <li key={friend.id} className="fr-friend-requests__item">
        <img src={friend.profileImageUrl || 'default_profile_image_url'} alt={friend.name} className="fr-friend-requests__item__img" />
        <div className="fr-friend-requests__item__info">
          {friend.name}
        </div>
        <button onClick={() => handleDeleteFriend(friend.id)} className="fr-friend-requests__button">Delete</button>
      </li>
    )) : (
      <p>You have no friends added.</p>
    )}
  </ul>
)}
        </div>
    );
}

export default FriendRequests;