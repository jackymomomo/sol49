import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { db } from '../firebase-config';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import '../scss/kwhGraph.scss';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatDate = (date) => date.toISOString().split('T')[0];

const KWhGraph = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Daily Energy Usage (kWh)',
        data: [],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Daily Cost ($)',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
      },
    ],
  });

  useEffect(() => {
    const fetchEnergyData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnapshot = await getDoc(userRef);
          const userData = userSnapshot.data();
          const neighbours = userData.neighbours || [];

          console.log("Current user ID:", user.uid);
          console.log("Neighbours:", neighbours);

          const sellersData = [];

          for (const neighbourId of neighbours) {
            const neighbourRef = doc(db, 'users', neighbourId);
            const neighbourSnapshot = await getDoc(neighbourRef);
            const neighbourData = neighbourSnapshot.data();

            if (neighbourData.canSellPower && neighbourData.neighbours.includes(user.uid)) {
              const seller = {
                uid: neighbourId,
                settingsRef: doc(db, 'userSettings', neighbourId),
              };
              const settingsSnapshot = await getDoc(seller.settingsRef);
              if (settingsSnapshot.exists()) {
                const { maxPrice } = settingsSnapshot.data();
                seller.maxPrice = maxPrice;
                sellersData.push(seller);
                console.log("Found seller:", seller.uid, "Price per kWh:", maxPrice);
              } else {
                console.log("Settings not found for seller:", seller.uid);
              }
            } else {
              console.log("Neighbour cannot sell or does not have the current user as a neighbour:", neighbourId);
            }
          }

          console.log("Sellers data:", sellersData);

          const energyQuery = query(collection(db, `user_energy/${user.uid}/daily_usage`));
          const querySnapshot = await getDocs(energyQuery);
          const labels = [];
          const kWhData = [];
          const costData = [];

          for (const docSnapshot of querySnapshot.docs) {
            const energyValueWh = docSnapshot.data().total_forward_energy;
            const energyValueKWh = energyValueWh / 100; // Convert Wh to kWh
            if (energyValueKWh > 0) {
              labels.push(formatDate(new Date(docSnapshot.id)));
              kWhData.push(energyValueKWh);

              let totalCost = 0;
              for (const seller of sellersData) {
                const cost = energyValueKWh * seller.maxPrice; // Move the decimal place up by one
                totalCost += cost;
                console.log(`Seller UID: ${seller.uid}, Energy (kWh): ${energyValueKWh}, Price per kWh: ${seller.maxPrice}, Cost: ${cost}`);
              }

              costData.push(totalCost);
              console.log("Date:", docSnapshot.id, "Energy (kWh):", energyValueKWh, "Total Cost ($):", totalCost);
            }
          }

          setChartData({
            labels,
            datasets: [
              { ...chartData.datasets[0], data: kWhData },
              { ...chartData.datasets[1], data: costData },
            ],
          });
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchEnergyData();
  }, []);

  return (
    <div className="chart-container">
      {chartData.labels.length > 0 ? (
        <>
          <h1>Historical Purchases</h1>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              scales: {
                y: {
                  type: 'linear',
                  position: 'left',
                  beginAtZero: true,
                  title: { display: true, text: 'kWh' },
                },
                y1: {
                  type: 'linear',
                  position: 'right',
                  beginAtZero: true,
                  title: { display: true, text: 'Cost ($)' },
                  grid: { drawOnChartArea: false },
                },
              },
              plugins: {
                legend: { display: true },
                tooltip: { enabled: true, mode: 'index', intersect: false },
              },
            }}
          />
        </>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default KWhGraph;
