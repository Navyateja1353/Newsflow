import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const Archive = () => {
    const navigate = useNavigate();
    const [dates, setDates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDates = async () => {
            try {
                const response = await axios.get('/api/public/all-published');
                
                // Extract unique dates from the published dates
                const uniqueDates = new Set();
                response.data.forEach(article => {
                    if (article.published_date) {
                        const dateObj = new Date(article.published_date);
                        // Format: YYYY-MM-DD
                        const dateString = dateObj.toISOString().split('T')[0];
                        uniqueDates.add(dateString);
                    }
                });

                // Sort descending (newest first)
                const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));
                setDates(sortedDates);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching archive dates:", error);
                setLoading(false);
            }
        };

        fetchDates();
    }, []);

    const handleSelectDate = (date) => {
        // Since the backend doesn't support date-specific fetching yet,
        // we'll navigate them to the main newspaper for now.
        // In the future this will be: navigate(`/newspaper/date/${date}`)
        alert(`ఆర్కైవ్ ఎడిషన్ (${date}) త్వరలో అందుబాటులో ఉంటుంది! (Archive edition viewing by date is coming soon. Redirecting to current edition.)`);
        navigate('/newspaper');
    };

    return (
        <div className="newspaper-viewer-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Simple Top Bar */}
            <div className="epaper-header-bar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
                <div style={{ flex: 1 }}>
                    <button 
                        onClick={() => navigate('/newspaper')} 
                        style={{ background: 'transparent', color: '#111', border: '1px solid #111', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                        Back
                    </button>
                </div>
                <h1 style={{ m: 0, fontWeight: 900, fontSize: '24px', letterSpacing: '1px' }}>E-PAPER ARCHIVE</h1>
                <div style={{ flex: 1 }}></div>
            </div>

            {/* Content Area */}
            <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ maxWidth: '800px', width: '100%', background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ color: '#00adef', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Browse Past Editions</h2>
                    
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '40px' }}>లోడింగ్ గత సంచికలు... (Loading...)</p>
                    ) : dates.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>ఎటువంటి ఆర్కైవ్స్ లేవు. (No archives available yet.)</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                            {dates.map((date, index) => {
                                const d = new Date(date);
                                const day = d.getDate();
                                const month = d.toLocaleString('default', { month: 'short' });
                                const year = d.getFullYear();
                                
                                return (
                                    <div 
                                        key={index} 
                                        onClick={() => handleSelectDate(date)}
                                        style={{ 
                                            border: '2px solid #ddd', 
                                            padding: '15px', 
                                            borderRadius: '8px', 
                                            cursor: 'pointer', 
                                            textAlign: 'center',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            backgroundColor: index === 0 ? '#f0f9ff' : 'white',
                                            borderColor: index === 0 ? '#00adef' : '#ddd'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#e5007e'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.borderColor = index === 0 ? '#00adef' : '#ddd'; e.currentTarget.style.transform = 'none'; }}
                                    >
                                        <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>{month} {year}</div>
                                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#111', margin: '5px 0' }}>{day}</div>
                                        {index === 0 && <span style={{ fontSize: '10px', backgroundColor: '#e60000', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>LATEST</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Archive;
