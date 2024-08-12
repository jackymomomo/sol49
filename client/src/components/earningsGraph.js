import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { db } from '../firebase-config';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import '../scss/kwhGraph.scss';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = [
  { energy: 'rgba(75, 192, 192, 0.5)', earnings: 'rgba(75, 192, 192, 1)' },
  { energy: 'rgba(255, 99, 132, 0.5)', earnings: 'rgba(255, 99, 132, 1)' },
  { energy: 'rgba(54, 162, 235, 0.5)', earnings: 'rgba(54, 162, 235, 1)' },
  { energy: 'rgba(255, 206, 86, 0.5)', earnings: 'rgba(255, 206, 86, 1)' },
  { energy: 'rgba(153, 102, 255, 0.5)', earnings: 'rgba(153, 102, 255, 1)' },
  { energy: 'rgba(255, 159, 64, 0.5)', earnings: 'rgba(255, 159, 64, 1)' },
];

const EarningsGraph = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchEarningsData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnapshot = await getDoc(userRef);
          const userData = userSnapshot.data();

          if (!userData.canSellPower) {
            console.log("User cannot sell power.");
            return;
          }

          const userSettingsRef = doc(db, 'userSettings', user.uid);
          const userSettingsSnapshot = await getDoc(userSettingsRef);
          const userSettingsData = userSettingsSnapshot.data();

          if (!userSettingsData || !userSettingsData.maxPrice) {
            console.error(`No maxPrice found for user: ${user.uid}`);
            return;
          }

          const maxPrice = userSettingsData.maxPrice;
          const neighbours = userData.neighbours || [];
          const earningsData = {};
          const neighbourNames = {};
          const neighbourTotals = {};

          console.log("User Neighbours:", neighbours);

          for (const neighbourId of neighbours) {
            const neighbourRef = doc(db, 'users', neighbourId);
            const neighbourSnapshot = await getDoc(neighbourRef);
            const neighbourData = neighbourSnapshot.data();

            if (!neighbourData) {
              console.log(`No data found for neighbour: ${neighbourId}`);
              continue;
            }

            if (neighbourData.canSellPower) {
              console.log(`Neighbour ${neighbourId} can sell power.`);
            }

            const neighbourName = neighbourData.name || neighbourId;
            neighbourNames[neighbourId] = neighbourName;
            neighbourTotals[neighbourId] = 0; // Initialize total for each neighbor

            const userEnergyQuery = query(collection(db, `user_energy/${neighbourId}/daily_usage`));
            const userEnergySnapshot = await getDocs(userEnergyQuery);

            for (const docSnapshot of userEnergySnapshot.docs) {
              const energyValueWh = docSnapshot.data().total_forward_energy;
              const energyValueKWh = energyValueWh / 100; // Convert Wh to kWh
              const date = docSnapshot.id;

              if (!earningsData[date]) {
                earningsData[date] = {};
              }

              if (!earningsData[date][neighbourId]) {
                earningsData[date][neighbourId] = 0;
              }

              // Check if energyValueKWh is a valid number
              if (isNaN(energyValueKWh)) {
                console.error(`Invalid data for date ${date}: energyValueKWh=${energyValueKWh}`);
                continue;
              }

              const earnings = energyValueKWh * maxPrice;
              earningsData[date][neighbourId] += earnings;

              neighbourTotals[neighbourId] += earnings; // Sum the earnings for the total

              console.log(`Date: ${date}, Neighbour: ${neighbourName}, Energy (kWh): ${energyValueKWh}, Price per kWh: ${maxPrice}, Earnings: ${earnings}`);
            }
          }

          // Filter out dates with zero earnings for all neighbors
          const filteredEarningsData = Object.keys(earningsData).reduce((acc, date) => {
            const totalEarnings = neighbours.reduce((sum, neighbourId) => sum + (earningsData[date][neighbourId] || 0), 0);
            if (totalEarnings > 0) {
              acc[date] = earningsData[date];
            }
            return acc;
          }, {});

          const labels = Object.keys(filteredEarningsData).sort();
          const datasets = neighbours.map((neighbourId, index) => {
            const colorIndex = index % COLORS.length;
            return {
              label: `${neighbourNames[neighbourId]} (Total: $${neighbourTotals[neighbourId].toFixed(2)})`,
              data: labels.map(date => filteredEarningsData[date][neighbourId] || 0),
              backgroundColor: COLORS[colorIndex].earnings,
              yAxisID: 'y1',
            };
          });

          console.log("Labels:", labels);
          console.log("Datasets:", datasets);

          setChartData({ labels, datasets });
        } catch (error) {
          console.error("Error fetching earnings data:", error);
        }
      }
    };

    fetchEarningsData();
  }, []);

  return (
    <div className="chart-container">
      {chartData.labels.length > 0 ? (
        <>
          <h1>Daily Earnings</h1>
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
                  title: { display: true, text: 'Earnings ($)' },
                  grid: { drawOnChartArea: false },
                },
              },
              plugins: {
                legend: { display: true },
                tooltip: { enabled: true, mode: 'index', intersect: false },
              },
              barPercentage: 0.85, // Adjust this value to control bar width
              categoryPercentage: 0.85, // Adjust this value to control category spacing
              grouped: true, // Ensure bars for each dataset (neighbor) are grouped together by date
            }}
          />
        </>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default EarningsGraph;
