import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api.js';

export const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await API.post("/users/login", formData);

      setMessage("Login Successful! ✅");

      // Token save kar lo (future mein use hoga)
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      // Login successful → Dashboard pe redirect
      setTimeout(() => {
        onLoginSuccess();
        navigate('/dashboard');
      }, 500);

    } catch (error) {
      console.log(error.response?.data);
      setMessage(error.response?.data?.message || "Invalid email or password ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">           
    <div className="auth-form">
      <h2>Login</h2>
      {message && <p className={`message ${message.includes("Successful") ? "success" : "error"}`}>
        {message}
      </p>}

      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          name="email" 
          placeholder="Enter your email" 
          value={formData.email} 
          onChange={handleChange}
          required 
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Enter your password" 
          value={formData.password} 
          onChange={handleChange}
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>
        Don't have an account? 
        <Link to="/register" className="switch-link">
          Register here
        </Link>
      </p>
      </div>
    </div>
  );
};