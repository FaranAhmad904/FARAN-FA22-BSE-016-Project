import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Auth.css";

function RestaurantManagerSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/auth/signup", { 
        name, 
        email, 
        password,
        role: 'restaurantManager'
      });
      if (res.data.success) {
        alert("✅ Signup successful! Please login.");
        navigate("/manager/login");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("❌ Error signing up: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="title">🍽️ DineMate</h2>
        <p className="subtitle">Restaurant Manager Signup</p>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Signup as Restaurant Manager</button>
        </form>
        <p className="switch-text">
          Already have an account? <Link to="/manager/login">Login</Link>
        </p>
        <p className="switch-text">
          Are you a customer? <Link to="/signup">Customer Signup</Link>
        </p>
      </div>
    </div>
  );
}

export default RestaurantManagerSignup;

