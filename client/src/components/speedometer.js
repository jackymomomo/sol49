import React from 'react';
import '../scss/speedometer.scss';

const SpeedometerGauge = ({ currentWatts, maxWatts, mode }) => {
  // Ensure currentWatts is a valid number
  const safeCurrentWatts = isNaN(currentWatts) ? 0 : currentWatts;
  const percentage = Math.min(100, (safeCurrentWatts / maxWatts) * 100); // Ensure percentage does not exceed 100

  let gaugeColor;
  let label;

  switch (mode) {
    case 'buy':
      gaugeColor = '#00ff00'; // Green for buying
      label = 'Buying';
      break;
    case 'sell':
      gaugeColor = '#ff0000'; // Red for selling
      label = 'Selling';
      break;
    default:
      gaugeColor = '#808080'; // Grey for off
      label = 'Off';
      break;
  }

  return (
    <div className="gaugeContainer">
      <div className="gaugebox">
        <div className="shadow"></div>
        <div className="content">
          <div className="percent" data-text={label} style={{ '--num': percentage, '--color': gaugeColor }}>
            <div className="dot" style={{ backgroundColor: gaugeColor }}></div>
            <svg>
              <circle cx="70" cy="70" r="70"></circle>
              <circle cx="70" cy="70" r="70" style={{ stroke: gaugeColor }}></circle>
            </svg>
          </div>
          <div className="number">
            <h2>{safeCurrentWatts}<span>W</span></h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedometerGauge;
