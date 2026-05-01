import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = ({ userId }) => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/favorites/${userId}`);
      setFavorites(res.data);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  return (
    <div>
      <h1>❤️ My Favorite Deals</h1>
      {favorites.length > 0 ? (
        favorites.map((deal, i) => (
          <div key={i} className="deal-card">
            <h2>{deal.restaurantName || "Unknown Restaurant"}</h2>
            {deal.deals.map((d, idx) => (
              <div key={idx}>
                <h4>{d.title}</h4>
                <p>{d.description}</p>
                <p><b>Price:</b> Rs. {d.price}</p>
                <p><b>Valid Till:</b> {d.validTill}</p>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>No favorites saved yet.</p>
      )}
    </div>
  );
};

export default Dashboard;

