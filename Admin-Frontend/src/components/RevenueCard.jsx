import './RevenueCard.css';

const RevenueCard = ({ title, icon, color, thisMonth, lastMonth, change }) => {
  const formatCurrency = (num) => {
    return `Rs. ${num?.toLocaleString('en-IN') || '0'}`;
  };

  const badgeClass = change >= 0 ? 'badge-positive' : 'badge-negative';

  return (
    <div className={`revenue-card revenue-${color}`}>
      <div className="revenue-header">
        <div>
          <h3 className="revenue-title">{title}</h3>
          <p className="revenue-period">This Month</p>
        </div>
        <span className={`revenue-icon revenue-icon-${color}`}>{icon}</span>
      </div>

      <div className="revenue-value">
        {formatCurrency(thisMonth)}
      </div>

      <div className="revenue-footer">
        <div className="revenue-comparison">
          <span className="comparison-label">vs. last month</span>
          <span className={`comparison-value ${badgeClass}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        </div>
        <div className="revenue-last-month">
          <span className="last-month-value">{formatCurrency(lastMonth)}</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueCard;
