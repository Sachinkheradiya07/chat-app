import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api.js';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
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
      const res = await API.post("/users/register", formData);
      
      setMessage("Registration Successful");

      // Clear form
      setFormData({ name: "", email: "", password: "" });

      // **1 second baad automatically Login page pe redirect**
      setTimeout(() => {
        navigate('/login');
      }, 1000);

    } catch (error) {
      console.log(error.response?.data);
      setMessage(error.response?.data?.message || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
    <div className="auth-form">
      <h2>Register</h2>
      {message && <p className={`message ${message.includes("Success") ? "success" : "error"}`}>
        {message}
      </p>}

      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="name" 
          placeholder="Enter your name" 
          value={formData.name} 
          onChange={handleChange}
          required 
        />
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
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p>
        Already have an account? 
        <Link to="/login" className="switch-link">
          Login here
        </Link>
      </p>
      </div>
    </div>
  );
};