import { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import RevenueCard from '../components/RevenueCard';
import { API_URL } from '../utils/api';
import './Dashboard.css';

const IconMembership = (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconSupplement = (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 5h18l-1.5 9h-15z" />
    <circle cx="9" cy="19" r="1.5" />
    <circle cx="17" cy="19" r="1.5" />
  </svg>
);

const IconBooking = (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="3" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M8 11l-3 3-3-3" />
    <path d="M16 11l3 3 3-3" />
  </svg>
);

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${API_URL}/api/analytics/dashboard`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        if (response.data.success) {
          setAnalytics(response.data.data);
          setError(null);
        } else {
          setError('Failed to fetch analytics data');
        }
      } catch (err) {
        console.error('Analytics error:', err);
        console.error('Error response:', err.response?.data);
        setError(`Error: ${err.response?.data?.message || err.message || 'Error fetching analytics'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">
          <p>{error}</p>
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
            Check browser console for details. Ensure backend is running at {API_URL}
          </p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  const { revenue, counts, thisMonthRevenue, lastMonthRevenue, totalRevenue } = analytics;

  const percentChange = (current, previous) => {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Overview of your business performance</p>
      </div>

      <div className="dashboard-content">
        {/* Total Revenue Section */}
        <div className="dashboard-section">
          <div className="section-title">Total Revenue</div>
          <div className="stat-cards-grid">
            <StatCard
              title="Total Revenue"
              value={totalRevenue}
              subtitle=""
            />
            <StatCard
              title="This Month"
              value={thisMonthRevenue}
              subtitle=""
              trend={percentChange(thisMonthRevenue, lastMonthRevenue)}
            />
            <StatCard
              title="Last Month"
              value={lastMonthRevenue}
              subtitle=""
            />
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="dashboard-section">
          <div className="section-title">Revenue Breakdown</div>
          <div className="revenue-cards-grid">
            <RevenueCard
              title="Membership"
              icon={IconMembership}
              color="membership"
              thisMonth={revenue.subscription.thisMonth}
              lastMonth={revenue.subscription.lastMonth}
              change={revenue.subscription.change}
            />
            <RevenueCard
              title="Supplements"
              icon={IconSupplement}
              color="supplement"
              thisMonth={revenue.supplement.thisMonth}
              lastMonth={revenue.supplement.lastMonth}
              change={revenue.supplement.change}
            />
            <RevenueCard
              title="Bookings"
              icon={IconBooking}
              color="booking"
              thisMonth={revenue.booking.thisMonth}
              lastMonth={revenue.booking.lastMonth}
              change={revenue.booking.change}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="dashboard-section">
          <div className="section-title">Key Metrics This Month</div>
          <div className="stat-cards-grid">
            <StatCard
              title="New Users"
              value={counts.newUsers}
              subtitle="Users joined this month"
            />
            <StatCard
              title="Orders"
              value={counts.orders}
              subtitle="Supplement orders"
            />
            <StatCard
              title="Bookings"
              value={counts.bookings}
              subtitle="Sessions & trainers booked"
            />
            {/* <StatCard
              title="Active Subscriptions"
              value={counts.subscriptions}
              subtitle="Active members"
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
