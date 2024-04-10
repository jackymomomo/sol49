import React from 'react';
import '../scss/speedometer.scss';

const SpeedometerGauge = ({ currentWatts, maxWatts }) => {
  const percentage = Math.min(100, (currentWatts / maxWatts) * 100); // Ensure percentage does not exceed 100

  return (
    <div className="gaugeContainer">
      <div className="gaugebox">
        <div className="shadow"></div>
        <div className="content">
          <div className="percent" data-text="Watts" style={{ '--num': percentage }}>
            <div className="dot"></div>
            <svg>
              <circle cx="70" cy="70" r="70"></circle>
              <circle cx="70" cy="70" r="70"></circle>
            </svg>
          </div>
          <div className="number">
            <h2>{currentWatts}<span>W</span></h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedometerGauge;
