// src/pages/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/login", { email, password });
            localStorage.setItem("token", res.data.token);
            navigate("/dashboard");
        } catch (err) {
            alert("Login failed: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <h1>Welcome Back</h1>
                <p className="subtitle">Sign in to your NewsFlow account</p>
                <form onSubmit={handleLogin}>
                    <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>Log In</button>
                </form>
                <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    Don't have an account? <a href="/register">Create one here</a>
                </p>
            </div>
        </div>
    );
}

export default Login;