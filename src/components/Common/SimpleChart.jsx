import './SimpleChart.css';

/**
 * Simple CSS-based bar chart component (no external library needed)
 */
const SimpleChart = ({ data = [], labelKey = 'label', valueKey = 'value', title = '', maxValue = null }) => {
  if (!data || data.length === 0) {
    return (
      <div className="simple-chart">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  // Calculate max value if not provided
  const max = maxValue || Math.max(...data.map(item => parseFloat(item[valueKey] || 0)));

  return (
    <div className="simple-chart">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-bars">
        {data.map((item, index) => {
          const value = parseFloat(item[valueKey] || 0);
          const percentage = max > 0 ? (value / max) * 100 : 0;
          
          return (
            <div key={index} className="chart-bar-item">
              <div className="chart-bar-label">{item[labelKey] || '-'}</div>
              <div className="chart-bar-container">
                <div 
                  className="chart-bar-fill"
                  style={{ width: `${percentage}%` }}
                  title={`${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                >
                  <span className="chart-bar-value">
                    Ksh {value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleChart;

