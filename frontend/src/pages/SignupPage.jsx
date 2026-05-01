import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRestaurantManager, setIsRestaurantManager] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:7000/api/auth/signup", { 
        name, 
        email, 
        password,
        role: isRestaurantManager ? 'restaurantManager' : 'customer'
      });
      if (res.data.success) {
        if (isRestaurantManager) {
          alert("✅ Restaurant Manager signup successful! Redirecting to login...");
          navigate("/manager/login");
        } else {
          alert("✅ Signup successful! Please login.");
          navigate("/");
        }
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
        <p className="subtitle">Create your account</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <input
              type="checkbox"
              id="restaurantManager"
              checked={isRestaurantManager}
              onChange={(e) => setIsRestaurantManager(e.target.checked)}
            />
            <label htmlFor="restaurantManager" style={{ color: '#666', cursor: 'pointer' }}>
              Sign up as Restaurant Manager
            </label>
          </div>
          <button type="submit">
            {isRestaurantManager ? "Signup as Restaurant Manager" : "Signup"}
          </button>
        </form>
        <p className="switch-text">
          Already have an account? <Link to="/">Login</Link>
        </p>
        <p className="switch-text">
          Restaurant Manager? <Link to="/manager/signup">Manager Signup</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;

