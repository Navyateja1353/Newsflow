// src/pages/PrivacyPolicy.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
                <button 
                    onClick={() => navigate('/newspaper')} 
                    style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                    Back to E-Paper
                </button>
            </div>

            <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2rem', marginTop: '4rem', textAlign: 'center' }}>
                <h1 style={{ color: '#00a650', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '1px' }}>Privacy Policy</h1>
                
                <div style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#444', textAlign: 'center', background: 'rgba(255,255,255,0.5)', padding: '3rem 1.5rem', borderRadius: '10px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#e60000', marginBottom: '1rem', letterSpacing: '1px' }}>
                        WANTED REPORTERS
                    </h2>
                    <p style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                        RTI EXPRESS
                    </p>
                    <p style={{ marginTop: '1rem', fontSize: '1.5rem' }}>
                        Contact: <a href="tel:7668886666" style={{ color: '#00adef', fontWeight: 'bold' }}>7668886666</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
