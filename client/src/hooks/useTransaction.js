import { useState } from 'react';
import { doc, getDocs, updateDoc, collection } from 'firebase/firestore';

function useTransaction(db) {
    const [mode, setMode] = useState('off');
    const [transactionMessage, setTransactionMessage] = useState('');

    const handleTransactionConfirmation = async (mode, userUID) => {
        const devicesRef = collection(db, 'users');
        const querySnapshot = await getDocs(devicesRef);
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.mode === (mode === 'sell' ? 'buy' : 'sell')) {
                const confirmTransaction = window.confirm(`Confirm transaction with ${doc.id}?`);
                if (confirmTransaction) {
                    updateDoc(doc(db, 'users', userUID), { mode: 'completed' });
                    setTransactionMessage(`Transaction with ${doc.id} completed.`);
                }
            }
        });
    };

    return {
        mode,
        setMode,
        transactionMessage,
        handleTransactionConfirmation
    };
}

export default useTransaction;
