// KwhGraph.js
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const KwhGraph = ({ totalForwardEnergy }) => {
  const chartRef = useRef(null);
  let myChart = null;

  useEffect(() => {
    if (chartRef.current) {
      myChart = echarts.init(chartRef.current);
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Here you will convert the `totalForwardEnergy` to data suitable for the series.
    // This is a placeholder for the conversion logic which you should replace with your actual logic.
    const data = days.map(day => Math.random() * 100); // Replace with actual kWh data for each day.

    const option = {
      xAxis: {
        type: 'category',
        data: days,
      },
      yAxis: {
        type: 'value',
      },
      series: [{
        data: data,
        type: 'bar',
      }]
    };

    myChart.setOption(option);

    return () => {
      myChart && myChart.dispose();
    };
  }, [totalForwardEnergy]); // Redraw chart if data changes

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
};

export default KwhGraph;
