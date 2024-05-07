import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

function useUserStatus(auth, db) {
    const [userStatus, setUserStatus] = useState(null);

    useEffect(() => {
        const fetchUserStatus = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setUserStatus(docSnap.data());
                } else {
                    console.log('No user document found');
                }
            }
        };

        fetchUserStatus();
    }, [auth, db]);

    return userStatus;
}

export default useUserStatus;
