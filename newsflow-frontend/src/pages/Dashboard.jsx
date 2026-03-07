import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const [news, setNews] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    // Decode role from JWT
    const getRole = () => {
        try {
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch (e) { return 'user'; }
    };
    const role = getRole();

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchNews();
        if (role === 'admin') {
            fetchSubmissions();
        }
    }, [token, role, navigate]);

    // --- Reporter Web News Functions ---
    const fetchNews = async () => {
        try {
            const res = await axios.get("/api/news"); // Public route
            setNews(res.data);
        } catch (error) { console.error(error); }
    };

    const deleteNews = async (id) => {
        try {
            await axios.delete(`/api/news/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchNews();
        } catch (error) { alert("Error deleting manual news"); }
    };

    // --- Admin WhatsApp Submissions Functions ---
    const fetchSubmissions = async () => {
        try {
            const res = await axios.get("/api/admin/submissions", { headers: { Authorization: `Bearer ${token}` } });
            setSubmissions(res.data);
        } catch (error) { console.error("Error fetching submissions", error); }
    };

    const handlePublish = async (id) => {
        try {
            await axios.post(`/api/admin/publish/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchSubmissions();
        } catch (error) { alert("Error publishing submission"); }
    };

    const handleDeleteSubmission = async (id) => {
        try {
            await axios.post(`/api/admin/delete/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchSubmissions();
        } catch (error) { alert("Error deleting submission"); }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="app-container">
            {/* Top Navbar */}
            <div className="top-nav" style={{ borderRadius: '15px', marginBottom: '2rem' }}>
                <div className="nav-brand">NewsFlow Dashboard</div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>
                        Role: <span style={{ color: 'var(--primary-color)' }}>{role ? role.toUpperCase() : 'REPORTER'}</span>
                    </span>
                    <button className="secondary-btn" onClick={() => navigate("/newspaper")}>
                        View Newspaper
                    </button>
                    <button className="danger-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: role === 'admin' ? '1fr 1fr' : '1fr', gap: '2rem' }}>

                {/* 📝 My Articles (Web News - Reporter/Admin) */}
                <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>Web Articles</h2>
                        <button onClick={() => navigate("/create-news")}>+ Create Draft</button>
                    </div>
                    {news.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No web articles drafted yet.</p> : null}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {news.map((item) => (
                            <div key={item.id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>{item.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {item.content}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="secondary-btn" onClick={() => navigate(`/edit-news/${item.id}`)}>Edit</button>
                                    <button className="secondary-btn" style={{ color: 'red' }} onClick={() => deleteNews(item.id)}>Discard</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🚨 WhatsApp Queue (Admin Only) */}
                {role === 'admin' && (
                    <div className="glass-panel" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>WhatsApp Submissions Queue</h2>
                        {submissions.filter(s => s.status === 'pending').length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>Queue is empty. Waiting for reporters...</p>
                        ) : null}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {submissions.filter(s => s.status === 'pending').map((sub) => (
                                <div key={sub.id} style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', borderLeft: '4px solid var(--secondary-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        Received: {new Date(sub.created_at).toLocaleString()} | Source: {sub.phone}
                                    </div>
                                    <p style={{ fontWeight: 500, marginBottom: '1rem' }}>{sub.message || "[Image only / No text]"}</p>

                                    {sub.has_image && (
                                        <div style={{ marginBottom: '1rem', color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>
                                            📸 Media Attached
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => navigate(`/edit-submission/${sub.id}`)}
                                            style={{ background: 'var(--primary-color)' }}
                                        >
                                            Review & Edit
                                        </button>

                                        <button
                                            className="secondary-btn"
                                            onClick={() => handlePublish(sub.id)}
                                            style={{ flex: 1 }}
                                        >
                                            ✨ Auto-Publish (AI)
                                        </button>

                                        <button
                                            className="secondary-btn"
                                            style={{ color: 'red' }}
                                            onClick={() => handleDeleteSubmission(sub.id)}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;