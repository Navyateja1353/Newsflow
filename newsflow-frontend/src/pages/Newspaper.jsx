import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';
import './Newspaper.css';

const ArticleBlock = ({ article, index, titleClass = "" }) => {
    // Default Fallbacks
    const placeholders = [
        "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80",
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80",
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&q=80",
        "https://images.unsplash.com/photo-1586339949916-3e9ed920624c?w=600&q=80",
        "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?w=600&q=80"
    ];

    const defaultImage = placeholders[index % placeholders.length];

    // Use uploaded image, or fallback to placeholder
    let fullImageUrl = defaultImage;
    if (article.image_url) {
        fullImageUrl = article.image_url.startsWith('http') ? article.image_url : `http://localhost:3000${article.image_url}`;
    }

    return (
        <article className="news-block">
            {/* 1. Title always comes first */}
            <div className="article-header-group">
                <h2 className={`article-title ${titleClass}`}>{article.headline || article.title}</h2>
            </div>

            {/* 2. Image comes second */}
            {fullImageUrl && (
                <div className="article-image-container">
                    <img
                        src={fullImageUrl}
                        alt={article.headline || article.title}
                        className="article-img"
                    />
                </div>
            )}

            {/* 3. Text content comes last */}
            <div className="article-content">
                {article.category && article.category !== 'సాధారణ' && (
                    <span className="inline-category-tag">{article.category}</span>
                )}
                {article.content}
            </div>
        </article>
    );
};

const Newspaper = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Format dates for display
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = today.toLocaleDateString('te-IN', options);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            const response = await axios.get('/api/public/all-published');
            setArticles(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching articles:", err);
            setError("వార్తలు లోడ్ చేయడంలో విఫలమైంది");
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-10 text-center">లోడింగ్...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="newspaper-container">

            {/* Action Buttons (Hidden on Print) */}
            <div className="newspaper-actions no-print text-center my-4">
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mx-2">
                    📄 ప్రింట్ (Print)
                </button>
                <button onClick={() => window.location.href = '/dashboard'} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mx-2">
                    🔙 డాష్బోర్డ్ (Dashboard)
                </button>
            </div>

            {/* Newspaper Header - Page 1 Style */}
            <header className="site-header">
                <div className="logo-section">
                    {/* Main Purple Logo Block */}
                    <div className="main-logo-box">
                        <div className="main-logo-wrapper">
                            <span className="main-logo-text">ఆర్ ఐ డబ్ల్యూ</span>
                        </div>
                        <div className="logo-sub-text">
                            <span className="telugu-daily">తెలుగు జాతీయ దినపత్రిక</span>
                            <span className="express-badge">ఎక్స్ ప్రెస్</span>
                        </div>
                    </div>

                    {/* Side Contact / Wanted Block */}
                    <div className="side-contact-box no-print">
                        <div className="wanted-heading">విలేకరులు కావలెను</div>
                        <div className="side-logo-title">
                            <span className="side-riw">ఆర్ ఐ డబ్ల్యూ</span>
                            <span className="side-express">ఎక్స్ ప్రెస్</span>
                        </div>
                        <div className="contact-details">
                            రెండు తెలుగు రాష్ట్రాల్లో పత్రిక దినపత్రిక RTI న్యూస్<br />
                            పేపర్ లో రిపోర్టింగ్ చేయుటకు గల న్యూస్ పేపర్ లో పని<br />
                            చేయుటకు ఆంధ్ర, తెలంగాణ రాష్ట్రాల్లో జిల్లా కేంద్రాలలో<br />
                            నియోజకవర్గాలలో మండల కేంద్రాలలో సామాజిక స్ఫూర్తి<br />
                            కలిగి ఉండి అంకిత భావంతో పనిచేసే విలేకరులు కావలెను.<br />
                            ఆసక్తి కలిగిన వారు క్రింది ఉన్న నెంబర్ కి సంప్రదించగలరు.
                        </div>
                        <div className="contact-number-box">
                            <div className="contact-label">సంప్రదించండి</div>
                            <div className="contact-number">7668886666</div>
                        </div>
                    </div>
                </div>

                {/* Green Meta Info Bar */}
                <div className="green-meta-bar">
                    <span>సంపుటి : 01</span>
                    <span>సంచిక : 65</span>
                    <span>ఎడిటర్: కోటపల్లి ఫాజియా</span>
                    <span>పేజీలు : 8,</span>
                    <span>వెల రూ. 2/-</span>
                    <span>{dateString}</span>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="newspaper-content">
                {articles.length === 0 ? (
                    <div className="text-center p-10">
                        <p>ప్రస్తుతం ఎటువంటి వార్తలు లేవు.</p>
                    </div>
                ) : (
                    <>
                        {/* PAGE 1: TOP 3-COLUMN GRID */}
                        {articles.length >= 4 && (
                            <div className="page-one-top-grid">
                                {/* Left Column */}
                                <div className="top-news-col">
                                    <ArticleBlock article={articles[0]} index={0} />
                                </div>

                                {/* Middle Column (2 articles) */}
                                <div className="top-news-col top-news-middle">
                                    <ArticleBlock article={articles[1]} index={1} titleClass="title-bg-red" />
                                    <ArticleBlock article={articles[2]} index={2} titleClass="title-bg-blue" />
                                </div>

                                {/* Right Column */}
                                <div className="top-news-col">
                                    <ArticleBlock article={articles[3]} index={3} />
                                </div>
                            </div>
                        )}

                        {/* PAGE 1: SPANNING FEATURED BLOCK */}
                        {articles.length >= 5 && (
                            <div className="featured-row-block">
                                <ArticleBlock article={articles[4]} index={4} />
                            </div>
                        )}

                        {/* REMAINING ARTICLES: STANDARD MASONRY */}
                        <div className="news-masonry-layout">
                            {articles.slice(5).map((article, idx) => (
                                <ArticleBlock key={article.id} article={article} index={idx + 5} />
                            ))}
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="newspaper-footer">

                {/* Printing Color Swatch strip similar to newspaper edges */}
                <div className="color-swatch-strip">
                    <div className="swatch" style={{ backgroundColor: '#000000' }}></div>
                    <div className="swatch" style={{ backgroundColor: '#00adef' }}></div>
                    <div className="swatch" style={{ backgroundColor: '#ec008c' }}></div>
                    <div className="swatch" style={{ backgroundColor: '#fff200' }}></div>
                    <div className="swatch" style={{ backgroundColor: '#8dc63f' }}></div>
                    <div className="swatch" style={{ backgroundColor: '#9e005d' }}></div>
                    <div className="swatch" style={{ backgroundColor: '#f47920' }}></div>
                    <div className="swatch" style={{ backgroundColor: '#7f3f98' }}></div>
                    <div className="swatch" style={{ backgroundColor: '#000000' }}></div>
                    <div className="swatch" style={{ backgroundColor: '#00adef' }}></div>
                </div>

                <p className="footer-copyright text-center text-sm">
                    © {today.getFullYear()} ఆర్ ఐ డబ్ల్యూ ఎక్స్ ప్రెస్ - వార్తాపత్రిక
                </p>
            </footer>
        </div>
    );
};

export default Newspaper;
