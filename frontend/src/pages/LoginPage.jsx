import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:7000/api/auth/login", { email, password });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role || "customer");
        try {
          const prof = await axios.get("http://localhost:7000/api/auth/profile", {
            headers: { Authorization: `Bearer ${res.data.token}` }
          });
          if (prof.data && prof.data._id) {
            localStorage.setItem("userId", prof.data._id);
          }
        } catch (_) {}
        alert("✅ Login successful!");
        if (onLogin) onLogin(res.data.token, res.data.role); // Notify App.js of login
        
        // Redirect based on role
        if (res.data.role === 'restaurantManager') {
          navigate("/manager/dashboard");
        } else if (res.data.isAdmin) {
          navigate("/admin/dashboard");
        } else {
          navigate("/home");
        }
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
        <p className="subtitle">Login to explore restaurant deals</p>
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
          Don't have an account? <Link to="/signup">Signup</Link>
        </p>
        <p className="switch-text">
          Restaurant Manager? <Link to="/manager/login">Manager Login</Link> | <Link to="/manager/signup">Manager Signup</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

