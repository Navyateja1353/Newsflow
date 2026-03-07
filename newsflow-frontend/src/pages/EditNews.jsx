import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function EditNews() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageData, setImageData] = useState(null);

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {

        try {

            const res = await axios.get(
                `/api/news/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setTitle(res.data.title);
            setContent(res.data.content);
            if (res.data.image_url) {
                setImageData(res.data.image_url); // Prefill existing image
            }

        } catch (error) {
            console.error(error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageData(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {

        e.preventDefault();

        try {

            await axios.put(
                `/api/news/${id}`,
                {
                    title,
                    content,
                    image_data: imageData
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            navigate("/dashboard");

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="app-container" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button className="secondary-btn" onClick={() => navigate("/dashboard")}>&larr; Back to Dashboard</button>
            </div>

            <div className="glass-panel">
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>Edit Article</h2>
                <form onSubmit={handleUpdate}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Headline</label>
                        <input
                            type="text"
                            placeholder="Enter a catchy title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Attached Image (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ padding: '0.5rem' }}
                        />
                        {imageData && (
                            <div style={{ marginTop: '1rem' }}>
                                <img src={imageData} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Article Content</label>
                        <textarea
                            placeholder="Write the full news story here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={10}
                            style={{ resize: 'vertical' }}
                            required
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '1rem' }}>
                        Update News
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditNews;