import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const [news, setNews] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [publishedSubmissions, setPublishedSubmissions] = useState([]);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'published', 'web'
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
            fetchPublishedSubmissions();
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
        if (!window.confirm("Are you sure you want to discard this draft?")) return;
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

    const fetchPublishedSubmissions = async () => {
        try {
            const res = await axios.get("/api/admin/published", { headers: { Authorization: `Bearer ${token}` } });
            setPublishedSubmissions(res.data);
        } catch (error) { console.error("Error fetching published submissions", error); }
    };

    // Pending Actions
    const handlePublish = async (id) => {
        try {
            await axios.post(`/api/admin/publish/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchSubmissions();
            fetchPublishedSubmissions();
        } catch (error) { alert("Error publishing submission"); }
    };

    const handleDeleteSubmission = async (id) => {
        if (!window.confirm("Reject this submission forever?")) return;
        try {
            await axios.post(`/api/admin/delete/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchSubmissions();
        } catch (error) { alert("Error deleting submission"); }
    };

    // Published Actions
    const handleRevertPublished = async (submissionId) => {
        if (!window.confirm("Un-publish this article and send back to Pending queue?")) return;
        try {
            await axios.post(`/api/admin/revert/text/${submissionId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchSubmissions();
            fetchPublishedSubmissions();
        } catch (error) { alert("Error reverting submission"); }
    };

    const handleDeletePublished = async (articleId) => {
        if (!window.confirm("PERMANENTLY delete this published article?")) return;
        try {
            await axios.delete(`/api/admin/published/${articleId}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchPublishedSubmissions();
        } catch (error) { alert("Error deleting published article"); }
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

            {role === 'admin' ? (
                <>
                    {/* Admin Tabs */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '1rem' }}>
                        <button
                            onClick={() => setActiveTab('pending')}
                            style={{
                                background: activeTab === 'pending' ? 'var(--primary-color)' : 'transparent',
                                color: activeTab === 'pending' ? 'white' : 'var(--text-color)',
                                boxShadow: activeTab === 'pending' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                            }}>
                            Pending Submissions ({submissions.filter(s => s.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('published')}
                            style={{
                                background: activeTab === 'published' ? 'var(--secondary-color)' : 'transparent',
                                color: activeTab === 'published' ? 'white' : 'var(--text-color)',
                                boxShadow: activeTab === 'published' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                            }}>
                            Published WhatsApp
                        </button>
                        <button
                            onClick={() => setActiveTab('web')}
                            style={{
                                background: activeTab === 'web' ? '#8b5cf6' : 'transparent',
                                color: activeTab === 'web' ? 'white' : 'var(--text-color)',
                                boxShadow: activeTab === 'web' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                            }}>
                            Web Articles
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            style={{
                                background: activeTab === 'settings' ? '#f59e0b' : 'transparent',
                                color: activeTab === 'settings' ? 'white' : 'var(--text-color)',
                                boxShadow: activeTab === 'settings' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                            }}>
                            ⚙️ Site Settings
                        </button>
                    </div>

                    {/* Pending Tab */}
                    {activeTab === 'pending' && (
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
                                            <button onClick={() => navigate(`/edit-submission/${sub.id}`)} style={{ background: 'var(--primary-color)' }}>
                                                Review & Edit
                                            </button>
                                            <button className="secondary-btn" onClick={() => handlePublish(sub.id)} style={{ flex: 1 }}>
                                                ✨ Auto-Publish (AI)
                                            </button>
                                            <button className="secondary-btn" style={{ color: 'red' }} onClick={() => handleDeleteSubmission(sub.id)}>
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Published Tab */}
                    {activeTab === 'published' && (
                        <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Live WhatsApp Articles</h2>
                            {publishedSubmissions.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No WhatsApp articles are currently live in the newspaper.</p>
                            ) : null}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {publishedSubmissions.map((pub) => (
                                    <div key={pub.id} style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', borderLeft: '4px solid var(--primary-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                            Published: {new Date(pub.published_date).toLocaleString()} | Original Reporter: {pub.reporter_phone}
                                        </div>
                                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', color: 'var(--primary-color)' }}>{pub.headline}</h3>
                                        <p style={{ fontWeight: 500, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {pub.content}
                                        </p>

                                        {pub.image_url && (
                                            <div style={{ marginBottom: '1rem', color: 'var(--secondary-color)', fontSize: '0.9rem', fontWeight: 600 }}>
                                                📸 Includes Live Image
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button onClick={() => navigate(`/edit-published/${pub.id}`)} style={{ background: '#8b5cf6' }}>
                                                Edit Live Article
                                            </button>
                                            <button className="secondary-btn" onClick={() => handleRevertPublished(pub.submission_id)} style={{ flex: 1 }}>
                                                ↩️ Un-Publish to Pending
                                            </button>
                                            <button className="secondary-btn" style={{ color: 'red' }} onClick={() => handleDeletePublished(pub.id)}>
                                                Permadelete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Web Actions Tab */}
                    {activeTab === 'web' && (
                        <div className="glass-panel" style={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2>Web Articles</h2>
                                <button onClick={() => navigate("/create-news")} style={{ background: '#8b5cf6' }}>+ Create Draft</button>
                            </div>
                            {news.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No web articles drafted yet.</p> : null}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {news.map((item) => (
                                    <div key={item.id} style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
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
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="glass-panel" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Site Settings</h2>
                            <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', borderLeft: '4px solid #f59e0b', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Update Global Logo</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload a new logo to accurately reflect current branding across newspaper pages and digital cards.</p>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                            try {
                                                await axios.post('http://localhost:3000/api/settings/logo', { value: reader.result }, { headers: { Authorization: `Bearer ${token}` } });
                                                alert("Logo successfully updated! This change is now live across the platform.");
                                            } catch(err) {
                                                console.error(err);
                                                alert("Error updating logo. Ensure the image is valid and the server is running.");
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }} 
                                    style={{ display: 'block', marginBottom: '2rem' }} 
                                />

                                <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '1.5rem' }} />

                                <h3 style={{ marginBottom: '1rem' }}>Or Select an Existing Newspaper Logo</h3>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    {[
                                        { id: 'rti', name: 'RTI Express', path: '/logos/rti.jpg' },
                                        { id: 'bharath', name: 'Bharath Reporter', path: '/logos/bharath.jpg' },
                                        { id: 'janam', name: 'Janam News', path: '/logos/janam.jpg' },
                                        { id: 'national', name: 'National News', path: '/logos/national.jpg' },
                                    ].map(logoOption => (
                                        <div 
                                            key={logoOption.id} 
                                            onClick={async () => {
                                                try {
                                                    await axios.post('http://localhost:3000/api/settings/logo', { value: logoOption.path }, { headers: { Authorization: `Bearer ${token}` } });
                                                    alert(`Logo successfully updated to ${logoOption.name}!`);
                                                } catch(err) {
                                                    alert("Error updating logo.");
                                                }
                                            }}
                                            style={{ 
                                                border: '2px solid #ddd', borderRadius: '8px', padding: '10px', 
                                                cursor: 'pointer', textAlign: 'center', width: '150px',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                                            onMouseOut={(e) => e.currentTarget.style.borderColor = '#ddd'}
                                        >
                                            <div style={{ height: '60px', backgroundColor: '#f9f9f9', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '12px' }}>
                                                {/* Requires images in public/logos/ directory */}
                                                <img src={logoOption.path} alt={logoOption.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                                     onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} 
                                                />
                                                <span style={{ display: 'none' }}>No Extracted Image</span>
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{logoOption.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1rem' }}>
                                    <em>Note: Make sure the 4 logo images are saved inside the `newsflow-frontend/public/logos` folder with names: rti.jpg, bharath.jpg, janam.jpg, national.jpg</em>
                                </p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Reporter View */
                <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>My Web Articles</h2>
                        <button onClick={() => navigate("/create-news")}>+ Create Draft</button>
                    </div>
                    {news.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No web articles drafted yet.</p> : null}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {news.map((item) => (
                            <div key={item.id} style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', borderLeft: '4px solid var(--primary-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
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
            )}
        </div>
    );
}

export default Dashboard;