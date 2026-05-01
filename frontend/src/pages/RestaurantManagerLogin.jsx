import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function RestaurantManagerLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:7000/api/auth/login", { email, password });
      if (res.data.success) {
        if (res.data.role !== "restaurantManager") {
          alert("❌ This login is only for restaurant manager accounts.");
          return;
        }
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        alert("✅ Login successful!");
        if (onLogin) onLogin(res.data.token, res.data.role); // Notify App.js of login
        navigate("/manager/dashboard");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("❌ Invalid credentials, please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="title">🍽️ DineMate</h2>
        <p className="subtitle">Restaurant Manager Login</p>
        <form onSubmit={handleLogin}>
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
          <button type="submit">Login</button>
        </form>
        <p className="switch-text">
          Don't have an account? <Link to="/manager/signup">Signup</Link>
        </p>
        <p className="switch-text">
          Are you a customer? <Link to="/">Customer Login</Link>
        </p>
      </div>
    </div>
  );
}

export default RestaurantManagerLogin;

