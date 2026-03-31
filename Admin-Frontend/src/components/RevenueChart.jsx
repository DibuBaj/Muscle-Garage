import './RevenueChart.css';

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Revenue Trend - Last 6 Months</h3>
        <div className="chart-loading">Loading chart data...</div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => d.total));
  const scale = 100 / maxValue;

  return (
    <div className="chart-container">
      <h3 className="chart-title">Revenue Trend - Last 6 Months</h3>
      <div className="chart-wrapper">
        <div className="simple-chart">
          {data.map((item, index) => (
            <div key={index} className="chart-item">
              <div className="chart-bars">
                <div className="bar-group">
                  <div
                    className="bar bar-subscription"
                    style={{ height: `${item.subscription * scale}%` }}
                    title={`Membership: Rs. ${item.subscription.toLocaleString('en-IN')}`}
                  ></div>
                  <span className="bar-label" style={{ color: '#3b82f6' }}>Membership</span>
                </div>
                <div className="bar-group">
                  <div
                    className="bar bar-supplement"
                    style={{ height: `${item.supplement * scale}%` }}
                    title={`Supplement: Rs. ${item.supplement.toLocaleString('en-IN')}`}
                  ></div>
                  <span className="bar-label" style={{ color: '#8b5cf6' }}>Supplement</span>
                </div>
                <div className="bar-group">
                  <div
                    className="bar bar-booking"
                    style={{ height: `${item.booking * scale}%` }}
                    title={`Bookings: Rs. ${item.booking.toLocaleString('en-IN')}`}
                  ></div>
                  <span className="bar-label" style={{ color: '#10b981' }}>Bookings</span>
                </div>
              </div>
              <div className="chart-month">{item.month}</div>
              <div className="chart-total">Rs. {(item.total / 1000).toFixed(0)}K</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
