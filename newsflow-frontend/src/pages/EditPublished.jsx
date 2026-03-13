import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function EditPublished() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchArticle();
    }, [id, token]);

    const fetchArticle = async () => {
        try {
            const res = await axios.get(`/api/admin/published/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setArticle(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching live article:", error);
            alert("Failed to load article details. It might have been deleted.");
            navigate("/dashboard");
        }
    };

    const handleUpdateLive = async () => {
        try {
            await axios.put(`/api/admin/published/${id}`, {
                headline: article.headline,
                content: article.content,
                category: article.category,
                image_url: article.image_url
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Live article updated successfully!");
            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Failed to update live article.");
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Live Article Data...</div>;

    const imageUrl = article.image_url ? (article.image_url.startsWith('http') ? article.image_url : `http://localhost:3000${article.image_url}`) : null;

    return (
        <div className="app-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="top-nav" style={{ borderRadius: '15px', marginBottom: '2rem' }}>
                <div className="nav-brand">⚠️ Editing LIVE Article #{id}</div>
                <button className="secondary-btn" onClick={() => navigate("/dashboard")}>Cancel</button>
            </div>

            <div className="glass-panel" style={{ borderTop: '4px solid #8b5cf6' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <strong>Note:</strong> Changes saved here will immediately reflect on the public Newspaper page.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Media Display */}
                    {imageUrl && (
                        <div style={{ textAlign: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            <img
                                src={imageUrl}
                                alt="Article Media"
                                style={{ maxHeight: '300px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                            />
                            <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>Live Image</p>
                        </div>
                    )}

                    {/* Headline */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Headline</label>
                        <input
                            type="text"
                            value={article.headline}
                            onChange={(e) => setArticle({ ...article, headline: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            placeholder="Enter Headline"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Full Article Body</label>
                        <textarea
                            value={article.content}
                            onChange={(e) => setArticle({ ...article, content: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                minHeight: '300px',
                                fontFamily: 'inherit',
                                fontSize: '1rem',
                                lineHeight: '1.6'
                            }}
                            placeholder="Article text..."
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Category Placement</label>
                        <select
                            value={article.category}
                            onChange={(e) => setArticle({ ...article, category: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="సాధారణ">సాధారణ (General)</option>
                            <option value="రాజకీయాలు">రాజకీయాలు (Politics)</option>
                            <option value="క్రీడలు">క్రీడలు (Sports)</option>
                            <option value="వ్యాపారం">వ్యాపారం (Business)</option>
                            <option value="వినోదం">వినోదం (Entertainment)</option>
                            <option value="సాంకేతికం">సాంకేతికం (Technology)</option>
                            <option value="స్థానికం">స్థానికం (Local)</option>
                        </select>
                    </div>

                    {/* Save Action */}
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handleUpdateLive}
                            style={{
                                flex: 1,
                                background: '#8b5cf6',
                                padding: '1rem',
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
                            }}
                        >
                            ✅ Update Live Newspaper
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default EditPublished;
