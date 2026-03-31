import './StatCard.css';

const StatCard = ({ title, value, subtitle, icon, trend, trendColor }) => {
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  return (
    <div className="stat-card">
      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value">{formatNumber(value)}</div>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`stat-trend trend-${trendColor || (trend >= 0 ? 'up' : 'down')}`}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          <span className="trend-label">{trend >= 0 ? 'vs last month' : 'vs last month'}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
