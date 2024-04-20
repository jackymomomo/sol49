import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

// Create the context
export const EnergyContext = createContext();

export const EnergyProvider = ({ children }) => {
  const [weeklyEnergy, setWeeklyEnergy] = useState(Array(7).fill(0));
  const [totalForwardEnergy, setTotalForwardEnergy] = useState('0 kWh');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const today = new Date().toISOString().slice(0, 10);
        const energyDocRef = doc(db, 'energyUsage', user.uid, 'daily', today);
        onSnapshot(energyDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setWeeklyEnergy(data.weeklyEnergy);
            setTotalForwardEnergy(`${data.totalForwardEnergy} kWh`);
          } else {
            setDoc(energyDocRef, {
              weeklyEnergy: Array(7).fill(0),
              totalForwardEnergy: 0,
              timestamp: serverTimestamp()
            });
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // The value that will be available to the context consumers
  const value = {
    weeklyEnergy,
    setWeeklyEnergy,
    totalForwardEnergy,
    setTotalForwardEnergy
  };

  return (
    <EnergyContext.Provider value={value}>
      {children}
    </EnergyContext.Provider>
  );
};
