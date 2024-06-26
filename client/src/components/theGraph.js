import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { db } from '../firebase-config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import '../scss/kwhGraph.scss'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatDate = (date) => date.toISOString().split('T')[0];

const KWhGraph = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ label: 'Daily Energy Usage (kWh)', data: [], backgroundColor: 'rgba(53, 162, 235, 0.5)' }]
  });

  useEffect(() => {
    const fetchEnergyData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // 7 days ago
        const endDate = new Date();

        const energyQuery = query(collection(db, `user_energy/${user.uid}/daily_usage`));

        try {
          const querySnapshot = await getDocs(energyQuery);
          const labels = [];
          const data = [];

          querySnapshot.forEach(doc => {
            const energyValue = doc.data().total_forward_energy / 100 + 0.01; // Convert Wh to kWh
            if (energyValue !== 0.0) {
              labels.push(formatDate(new Date(doc.id)));
              data.push(energyValue);
            }
          });

          setChartData({ labels, datasets: [{ ...chartData.datasets[0], data }] });
        } catch (error) {
          console.error("Error fetching energy data:", error);
        }
      }
    };

    fetchEnergyData();
  }, []);

  return (
    <div className="chart-container">
      {chartData.labels.length > 0 && (
        <>
          <h1>Historical Purchases</h1>
          <Bar data={chartData} options={{
            responsive: true,
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'kWh' } }
            },
            plugins: {
              legend: { display: false }, // Remove the legend
              tooltip: { enabled: true, mode: 'index', intersect: false }
            },
          }} />
        </>
      )}
    </div>
  );
};

export default KWhGraph;
