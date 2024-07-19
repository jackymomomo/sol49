import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { db } from '../firebase-config';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import '../scss/kwhGraph.scss';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatDate = (date) => date.toISOString().split('T')[0];

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

          // Only display graph if the user can sell power
          if (!userData.canSellPower) {
            return;
          }

          const neighbours = userData.neighbours || [];

          console.log("Current user ID:", user.uid);
          console.log("Neighbours:", neighbours);

          const earningsData = {};
          const energyData = {};
          const neighbourNames = {};

          for (const [index, neighbourId] of neighbours.entries()) {
            const neighbourRef = doc(db, 'users', neighbourId);
            const neighbourSnapshot = await getDoc(neighbourRef);
            const neighbourName = neighbourSnapshot.data().name || neighbourId; // Fetch neighbour name
            neighbourNames[neighbourId] = neighbourName;

            const owedQuery = query(collection(db, `user_owed/${neighbourId}/daily_owed`));
            const owedSnapshot = await getDocs(owedQuery);

            for (const docSnapshot of owedSnapshot.docs) {
              const { totalOwed } = docSnapshot.data();
              const date = docSnapshot.id;

              if (!earningsData[neighbourId]) {
                earningsData[neighbourId] = {};
                energyData[neighbourId] = {};
              }

              if (!earningsData[neighbourId][date]) {
                earningsData[neighbourId][date] = 0;
                energyData[neighbourId][date] = 0;
              }

              earningsData[neighbourId][date] += totalOwed;

              // Fetch energy data for the corresponding date
              const energyRef = doc(db, `user_energy/${neighbourId}/daily_usage`, date);
              const energySnapshot = await getDoc(energyRef);
              if (energySnapshot.exists()) {
                const energyValueWh = energySnapshot.data().total_forward_energy;
                const energyValueKWh = energyValueWh / 1000; // Convert Wh to kWh
                energyData[neighbourId][date] += energyValueKWh;
              }
            }
          }

          const labels = Array.from(new Set(Object.values(earningsData).flatMap(Object.keys)));
          const datasets = [];

          for (const [index, neighbourId] of Object.keys(earningsData).entries()) {
            const neighborName = neighbourNames[neighbourId];
            const neighborEarnings = labels.map(label => earningsData[neighbourId][label] || 0);
            const neighborEnergy = labels.map(label => energyData[neighbourId][label] || 0);
            const colorSet = COLORS[index % COLORS.length];

            datasets.push({
              label: `${neighborName} - Earnings ($)`,
              data: neighborEarnings,
              backgroundColor: colorSet.earnings,
              yAxisID: 'y1',
            });

            datasets.push({
              label: `${neighborName} - Energy Sold (kWh)`,
              data: neighborEnergy,
              backgroundColor: colorSet.energy,
              yAxisID: 'y',
            });
          }

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
