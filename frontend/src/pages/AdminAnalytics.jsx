import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import "../styles/AdminDashboard.css";

const AdminAnalytics = ({ onLogout, darkMode, onToggleTheme }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillData, setDrillData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:7000/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setStats(res.data);
    } catch (err) {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const colors = ["#d70f64", "#ff9800", "#4caf50", "#03a9f4", "#9c27b0", "#ffc107", "#8bc34a", "#00bcd4"];

  const viewsData = stats?.analytics?.restaurantViews || [];
  const clicksData = stats?.analytics?.restaurantClicks || [];
  const conversionData = stats?.analytics?.restaurantConversion || [];
  const topDeals = stats?.analytics?.topDeals || [];

  const handleRestaurantClick = async (restaurantId) => {
    setDrillOpen(true);
    setDrillLoading(true);
    try {
      const res = await axios.get(`http://localhost:7000/api/admin/dashboard/${restaurantId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setDrillData(res.data);
    } catch {
      setDrillData(null);
    } finally {
      setDrillLoading(false);
    }
  };

  const lineCombinedData = viewsData.map(v => {
    const c = clicksData.find(x => x.restaurantId === v.restaurantId);
    return { name: v.name, views: v.views, clicks: c ? c.clicks : 0 };
  });

  return (
    <div className={`admin-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <header className="admin-header">
        <div className="header-top">
          <h1>📈 Analytics Dashboard</h1>
          <div className="header-buttons">
            <button className="theme-toggle-btn" onClick={onToggleTheme}>
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/dashboard")}>
              📊 Dashboard
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/restaurants")}>
              🏪 Restaurants
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/deals")}>
              🎯 Deals
            </button>
            <button className="nav-btn" onClick={() => navigate("/admin/subscriptions")}>
              💳 Subscriptions
            </button>
            <button className="nav-btn" onClick={() => navigate("/home")}>
              🏠 Home
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        ) : !stats ? (
          <p className="no-data">No analytics available</p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏪</div>
                <div className="stat-info">
                  <h3>{stats.totalRestaurants}</h3>
                  <p>Total Restaurants</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👀</div>
                <div className="stat-info">
                  <h3>{stats.totalViews}</h3>
                  <p>Total Views</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🖱️</div>
                <div className="stat-info">
                  <h3>{stats.totalClicks}</h3>
                  <p>Total Clicks</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚙️</div>
                <div className="stat-info">
                  <h3>{stats.conversionRateAvg}%</h3>
                  <p>Avg Conversion</p>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h2>Views per Restaurant</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={viewsData} onClick={(e) => e && e.activePayload && e.activePayload[0] && handleRestaurantClick(e.activePayload[0].payload.restaurantId)}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#d70f64" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="section-card">
              <h2>Clicks vs Views</h2>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={lineCombinedData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#03a9f4" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="#ff9800" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="section-card">
              <h2>Conversion Rate Distribution</h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={conversionData} dataKey="conversionRate" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                    {conversionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="section-card">
              <h2>Top 5 Deals</h2>
              {topDeals.length > 0 ? (
                <div className="restaurants-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Deal</th>
                        <th>Restaurant</th>
                        <th>Views</th>
                        <th>Clicks</th>
                        <th>Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDeals.map((d) => (
                        <tr key={d.dealId}>
                          <td>{d.title}</td>
                          <td>{d.restaurantName}</td>
                          <td>{d.views}</td>
                          <td>{d.clicks}</td>
                          <td>{(d.views || 0) > 0 ? `${Number(((d.clicks || 0) / d.views) * 100).toFixed(2)}%` : "0%"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No deals data</p>
              )}
            </div>
          </>
        )}
      </main>

      {drillOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setDrillOpen(false)}
        >
          <div
            className="section-card"
            style={{
              width: "90%",
              maxWidth: "900px",
              maxHeight: "85vh",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {drillLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading details...</p>
              </div>
            ) : drillData ? (
              <>
                <div className="page-header">
                  <h2>{drillData.summary.name}</h2>
                  <button className="close-btn" onClick={() => setDrillOpen(false)}>✖</button>
                </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👀</div>
                    <div className="stat-info">
                      <h3>{drillData.summary.totalViews}</h3>
                      <p>Views</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🖱️</div>
                    <div className="stat-info">
                      <h3>{drillData.summary.totalClicks}</h3>
                      <p>Clicks</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⚙️</div>
                    <div className="stat-info">
                      <h3>{drillData.summary.conversionRate}%</h3>
                      <p>Conversion</p>
                    </div>
                  </div>
                </div>
                <div className="section-card">
                  <h2>Deal Views</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={drillData.deals}>
                      <XAxis dataKey="title" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#d70f64" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="section-card">
                  <h2>Deal Clicks vs Views</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={drillData.deals}>
                      <XAxis dataKey="title" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#03a9f4" strokeWidth={2} />
                      <Line type="monotone" dataKey="clicks" stroke="#ff9800" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="section-card">
                  <h2>Deals</h2>
                  <div className="restaurants-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Views</th>
                          <th>Clicks</th>
                          <th>Conversion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drillData.deals.map(d => (
                          <tr key={d.dealId}>
                            <td>{d.title}</td>
                            <td>{d.views}</td>
                            <td>{d.clicks}</td>
                            <td>{d.conversionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="no-data">No details available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
