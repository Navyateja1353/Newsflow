// src/pages/Register.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
    // Step 1: Basic Info
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Step 2: Newspaper Customization
    const [step, setStep] = useState(1);
    const [textSize, setTextSize] = useState("Medium");
    const [theme, setTheme] = useState("Light");
    const [sections, setSections] = useState({
        Politics: true,
        Sports: false,
        Business: true,
        Technology: false,
        Entertainment: false,
    });
    const [role, setRole] = useState("reporter");

    const navigate = useNavigate();

    const handleSectionChange = (section) => {
        setSections({ ...sections, [section]: !sections[section] });
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        if (!name || !email || !password) {
            alert("Please fill in all standard details.");
            return;
        }
        setStep(2);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const selectedSections = Object.keys(sections).filter((key) => sections[key]);

        const payload = {
            name,
            email,
            password,
            role,
            layout_preferences: {
                text_size: textSize,
                theme: theme,
                sections: selectedSections
            }
        };

        try {
            await axios.post("/api/register", payload);
            alert("Account and customized layout created successfully!");
            navigate("/login");
        } catch (err) {
            const errData = err.response?.data;
            const errMsg = errData?.message || (errData?.error && errData.error.sqlMessage) || errData?.error || err.message;
            alert("Registration failed: " + errMsg);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card" style={{ maxWidth: '500px' }}>
                <h1>Join NewsFlow</h1>
                <p className="subtitle">{step === 1 ? 'Create your reporter/admin account' : 'Customize your layout preferences'}</p>

                {step === 1 ? (
                    <form onSubmit={handleNextStep}>
                        <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name</label>
                            <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Address</label>
                            <input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
                            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Account Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="reporter">News Reporter</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>

                        <button type="submit" style={{ width: '100%' }}>
                            Next Step &rarr;
                        </button>

                        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                            Already have an account? <a href="/login">Log in here</a>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Text Size</label>
                            <select value={textSize} onChange={(e) => setTextSize(e.target.value)}>
                                <option value="Small">Small</option>
                                <option value="Medium">Medium</option>
                                <option value="Large">Large</option>
                            </select>
                        </div>

                        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Theme</label>
                            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                                <option value="Light">Light Mode</option>
                                <option value="Dark">Dark Mode</option>
                                <option value="Classic Newspaper">Classic Newspaper</option>
                            </select>
                        </div>

                        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Preferred Sections</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '10px' }}>
                                {Object.keys(sections).map((section) => (
                                    <label key={section} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.95rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={sections[section]}
                                            onChange={() => handleSectionChange(section)}
                                            style={{ margin: 0, marginRight: '8px', width: 'auto' }}
                                        />
                                        {section}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="secondary-btn" onClick={() => setStep(1)} style={{ flex: 1 }}>
                                Back
                            </button>
                            <button type="submit" style={{ flex: 2 }}>
                                Create Account
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Register;