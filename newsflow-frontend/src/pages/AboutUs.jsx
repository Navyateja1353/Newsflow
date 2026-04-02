// src/pages/AboutUs.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function AboutUs() {
    const navigate = useNavigate();

    return (
        <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Nav Header back to Newspaper */}
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
                <h1 style={{ color: '#e5007e', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '1px' }}>About Us</h1>
                
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
                    # 7-2-28, FOUZIYA PUBLICATIONS
                </h2>
                
                <div style={{ fontSize: '1rem', lineHeight: '1.8', color: '#444', textAlign: 'left', background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '10px' }}>
                    <p><strong>Address:</strong> VD Road, HINDUPUR-515201, Sri Sathya Sai Dist. A.P.</p>
                    <p><strong>GSTIN:</strong> 37ABJPF4955F1ZK</p>
                    <p><strong>Certificate of incorporation:</strong> U64200AP2021PTC118146</p>
                    <p><strong>MSME:</strong> UDYAM-AP-25-00383710</p>
                    <p><strong>Register of Firms No:</strong> (43 of 2018)</p>
                    <p><strong>Labour Reg No:</strong> AP-25-18-006-03671823</p>
                    <p><strong>Postal licensed:</strong> HDP/01/2024-2026:AP</p>
                    <p style={{ marginTop: '1rem' }}>
                        <strong>e-mail:</strong> <a href="mailto:rtiexpress@gmail.com" style={{ color: '#00adef' }}>rti express@gmail.com</a>
                    </p>
                    <p>
                        <strong>Mob:</strong> <a href="tel:7668886666" style={{ color: '#00adef' }}>7668886666</a>
                    </p>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'center' }}>
                        <a href="http://www.fouziyanewspublications.com" target="_blank" rel="noreferrer" style={{ color: '#e5007e', fontWeight: 'bold' }}>www.fouziyanewspublications.com</a>
                        <a href="http://www.rtiexpress.in" target="_blank" rel="noreferrer" style={{ color: '#e5007e', fontWeight: 'bold' }}>www.rtiexpress.in</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutUs;
