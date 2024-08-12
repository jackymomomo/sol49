import React from 'react';
import '../scss/speedometer.scss';

const SpeedometerGauge = ({ currentWatts, maxWatts, mode }) => {
    // Convert the small decimal value to a larger whole number
    const scaledWatts = currentWatts * 1000; // Multiply by 1000 to convert 0.027W to 27W

    const safeCurrentWatts = isNaN(scaledWatts) ? 0 : scaledWatts;
    const percentage = Math.min(100, (safeCurrentWatts / maxWatts) * 10);

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
                        <h2>{safeCurrentWatts.toFixed(0)}<span>W</span></h2> {/* Display whole number */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeedometerGauge;
