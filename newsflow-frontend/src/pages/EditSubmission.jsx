import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function EditSubmission() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState(null);
    const [headline, setHeadline] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("సాధారణ");
    const [imageUrl, setImageUrl] = useState("");

    // For "Publish using AI" feature from this screen
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchSubmission();
    }, [id]);

    const fetchSubmission = async () => {
        try {
            const res = await axios.get(
                `/api/admin/submissions/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSubmission(res.data);
            setContent(res.data.message || "");

            if (res.data.image_urls && res.data.image_urls.length > 0) {
                const cleanedUrls = cleanImageUrls(res.data.image_urls);
                if (cleanedUrls.length > 0) {
                    setImageUrl(cleanedUrls[0]);
                }
            }
        } catch (error) {
            console.error(error);
            alert("Error loading submission. It may have been deleted or published already.");
            navigate("/dashboard");
        }
    };

    // Helper to sanitize database urls that might just be a comma due to GROUP_CONCAT
    const cleanImageUrls = (urls) => {
        if (!urls || !Array.isArray(urls)) return [];
        return urls.filter(url => url && url.trim().length > 1);
    };

    const handleManualPublish = async (e) => {
        e.preventDefault();

        if (!headline || !content) {
            return alert("Headline and Content are required to publish.");
        }

        try {
            await axios.post(
                `/api/admin/publish-manual/${id}`,
                {
                    headline,
                    content,
                    category,
                    image_url: imageUrl
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Article published successfully!");
            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Error publishing article manually.");
        }
    };

    const handleAIPublish = async () => {
        if (!window.confirm("This will automatically generate a headline and category using AI and publish immediately. Continue?")) {
            return;
        }

        setIsGeneratingAI(true);
        try {
            await axios.post(
                `/api/admin/publish/${id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Published successfully using AI!");
            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Error publishing with AI.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    if (!submission) return <div className="app-container"><p>Loading submission...</p></div>;

    return (
        <div className="app-container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button className="secondary-btn" onClick={() => navigate("/dashboard")}>&larr; Back to Dashboard</button>
            </div>

            <div className="glass-panel" style={{ borderLeft: '4px solid var(--secondary-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1rem' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Review WhatsApp Submission</h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>From: {submission.phone}</span>
                    </div>

                    <button
                        className="secondary-btn"
                        onClick={handleAIPublish}
                        disabled={isGeneratingAI}
                        style={{ border: '1px solid var(--secondary-color)', color: 'var(--secondary-color)' }}
                    >
                        {isGeneratingAI ? "Generating..." : "✨ Auto-Publish (AI)"}
                    </button>
                </div>

                <form onSubmit={handleManualPublish}>

                    {/* Media Display */}
                    {imageUrl && (
                        <div style={{ marginBottom: '2rem', textAlign: 'center', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                            <p style={{ fontWeight: '600', marginBottom: '0.5rem', textAlign: 'left' }}>Attached Media</p>
                            <img
                                src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:3000${imageUrl}`}
                                alt="Submission media"
                                style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Headline (Required)</label>
                            <input
                                type="text"
                                placeholder="Enter headline before publishing..."
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
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
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                            Article Content (From WhatsApp)
                        </label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            You can edit this raw text before it goes live. Add formatting or fix errors.
                        </p>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={12}
                            style={{ resize: 'vertical' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}>
                            ✅ Publish to Newspaper
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditSubmission;
