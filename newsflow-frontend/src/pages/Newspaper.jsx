import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import '../index.css';
import './Newspaper.css';
import newspaperSettings from '../config/newspaperSettings';
import { QRCodeSVG } from 'qrcode.react';

import LayoutEngine from '../components/LayoutEngine';
import ArticleCard from '../components/ArticleCard';

const Newspaper = () => {
    const { page } = useParams();
    const navigate = useNavigate();

    // Ensure currentPage is always a valid number based on URL
    const currentPage = page ? parseInt(page, 10) : 1;

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [zoomedArticle, setZoomedArticle] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const printAreaRef = useRef(null);

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
            
            // Deduplicate articles based on exactly matching headlines
            const uniqueArticles = [];
            const seenHeadlines = new Set();
            
            for (const article of response.data) {
                const normalizedHeadline = (article.headline || article.title || "").trim().toLowerCase();
                
                // If it's empty, or we haven't seen this headline yet, add it
                if (!normalizedHeadline || !seenHeadlines.has(normalizedHeadline)) {
                    if (normalizedHeadline) {
                        seenHeadlines.add(normalizedHeadline);
                    }
                    uniqueArticles.push(article);
                }
            }
            
            setArticles(uniqueArticles);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching articles:", err);
            setError("వార్తలు లోడ్ చేయడంలో విఫలమైంది");
            setLoading(false);
        }
    };

    const handleDownloadFullPDF = async () => {
        if (!printAreaRef.current) return;
        
        setPdfLoading(true);

        try {
            const pdf = new jsPDF('p', 'pt', [1080, 1638]); // Exact Broadsheet size in points (15 x 22.75 inches)
            // Find all newspaper pages that have been rendered into the DOM
            const pageElements = printAreaRef.current.querySelectorAll('.newspaper-page');
            
            for (let i = 0; i < pageElements.length; i++) {
                const pageEl = pageElements[i];
                
                // Backup existing styles
                const originalClassName = pageEl.className;
                const originalCssText = pageEl.style.cssText;
                
                // Force to explicit 1440px wide and 2184px tall for PDF rendering fidelity
                pageEl.className = 'newspaper-page active-page';
                pageEl.style.width = '1440px';
                pageEl.style.minWidth = '1440px';
                pageEl.style.maxWidth = '1440px';
                pageEl.style.height = '2184px';
                pageEl.style.minHeight = '2184px';
                pageEl.style.maxHeight = '2184px';
                
                // Allow a tiny delay for browser to apply style changes before painting
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Scale 3 provides crisp retina/print quality text for Broadsheet sizes. 
                // Passed windowWidth guarantees the CSS multi-columns don't crunch together.
                const canvas = await html2canvas(pageEl, { 
                    scale: 3, 
                    useCORS: true, 
                    logging: false,
                    width: 1440,
                    height: 2184,
                    windowWidth: 1440,
                    windowHeight: 2184
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                if (i > 0) {
                    pdf.addPage([1080, 1638], 'p');
                }
                
                // Add the captured image to fill the exact Broadsheet page dimension
                pdf.addImage(imgData, 'JPEG', 0, 0, 1080, 1638);
                
                // Restore its original hidden/shown state and styles
                pageEl.style.cssText = originalCssText;
                pageEl.className = originalClassName;
            }

            // Trigger the download automatically
            pdf.save(`${newspaperSettings.mainLogoText}-${newspaperSettings.subText2}-Edition-${today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}.pdf`);
        } catch (err) {
            console.error("Error generating full PDF:", err);
            alert("PDF డౌన్‌లోడ్ విఫలమైంది (Failed to download PDF).");
        } finally {
            setPdfLoading(false);
        }
    };

    // Limit the maximum number of pages generated to match standard physical newspapers (8-12 pages)
    const MAX_TOTAL_PAGES = 10;
    
    const pages = [];

    if (articles.length > 0) {
        // Filter out English placeholder articles and editor notes
        const filteredArticles = articles.filter(a => {
            const text = (a.content || "") + " " + (a.headline || a.title || "");
            if (text.includes("Editor's Note")) return false;
            if (text.includes("synthetic creation")) return false;
            // Also optionally filter out purely english articles if they have no Telugu characters
            const teluguRegex = /[\u0C00-\u0C7F]/;
            if (!teluguRegex.test(text) && text.length > 20) return false;
            return true;
        });

        // Group and sort articles by category (or whatever priority)
        const sortedArticles = [...filteredArticles].sort((a, b) => {
            const catA = a.category || "General";
            const catB = b.category || "General";
            return catA.localeCompare(catB);
        });

        // --- PAGE 1 LOGIC ---
        // Top featured still get their dedicated magazine item spots
        const page1Count = Math.min(5, sortedArticles.length);
        const topFeatured = sortedArticles.slice(0, page1Count);
        
        // We will pull from the available articles without refilling to prevent duplicates
        let pool = [...sortedArticles.slice(page1Count)]; 
        
        // Heuristic function to estimate pixel height of an article (Linear 1-column height equivalent)
        const estimateArticleHeight = (article) => {
            let height = 0;
            // Base padding/borders plus title margins
            height += 50; 
            
            // Headline estimation
            const headline = article.headline || article.title || "";
            height += Math.ceil(headline.length / 30) * 28; 
            
            // Image estimation
            if (article.image_url) {
                height += 220; // Tighter image height
            }
            
            // Content estimation
            const content = article.content || "";
            // In a 3-column layout, Telugu text is actually quite dense.
            // In a Broadsheet 3-column layout, columns are very wide (approx 480px).
            // Using a realistic physical width of 65 characters per line to force dense packing.
            height += Math.ceil(content.length / 65) * 22; 
            
            return height;
        };

        const getArticlesByHeight = (targetHeight) => {
            const result = [];
            let currentHeight = 0;
            
            let i = 0;
            while (i < pool.length && currentHeight < targetHeight) {
                const article = pool[i];
                const estimatedHeight = estimateArticleHeight(article);
                
                // Allow a small 50px overflow buffer.
                if (currentHeight + estimatedHeight <= targetHeight + 50) {
                    result.push(article);
                    currentHeight += estimatedHeight;
                    pool.splice(i, 1); // remove from pool
                    // Do NOT increment i, because the array shifted left
                } else {
                    // This article is too big for the remaining space.
                    // Skip it and look for a smaller one further down the pool that WILL fit.
                    i++;
                }
            }
            
            // Safety fallback: If this page couldn't fit a SINGLE article (because all remaining 
            // articles in the pool are individually larger than the entire page), 
            // force push the first one so we don't end up in an infinite loop printing blank pages.
            if (result.length === 0 && pool.length > 0) {
                const article = pool.shift();
                result.push(article);
                currentHeight += estimateArticleHeight(article);
            }
            
            return { items: result, totalHeight: currentHeight, remaining: Math.max(0, targetHeight - currentHeight) };
        };

        // Page 1 has massive headers/features, remaining masonry space is ~900px height.
        // 900px * 3 columns = 2700px total vertical capacity for 1/3 width articles.
        const page1Data = getArticlesByHeight(2700);
        const page1GridItems = page1Data.items;

        pages.push({
            isFrontPage: true,
            topFeatured: topFeatured,
            gridItems: page1GridItems,
            adHeight: 0 // Rely on CSS flex-grow instead of static height
        });

        // Guarantee enough pages to display all content without exceeding MAX_TOTAL_PAGES
        while (pages.length < MAX_TOTAL_PAGES && pool.length > 0) {
            
            if (pages.length === MAX_TOTAL_PAGES - 1) {
                // This is the absolute final page allowed!
                // We MUST dump all remaining articles here so nothing is dropped.
                // The CSS column layout will just stretch to fit them all.
                pages.push({
                    isFrontPage: false,
                    topFeatured: [],
                    gridItems: [...pool],
                    adHeight: 0 // Rely on CSS flex-grow
                });
                pool = []; // Empty the pool so the loop terminales
            } else {
                // Inner pages have ~1900px of vertical room on Broadsheets. 
                // 3 columns of 1900px = 5700px total capacity of 1/3 width articles.
                // Target strictly 5700px so it perfectly fills without overflowing vertically.
                const pageData = getArticlesByHeight(5700);
                const pageGridItems = pageData.items;

                pages.push({
                    isFrontPage: false,
                    topFeatured: [],
                    gridItems: pageGridItems,
                    adHeight: 0 // Rely on CSS flex-grow
                });
            }
        }
    }

const PaperFooter = ({ pageIndex }) => {
    return (
        <footer className="newspaper-footer no-print-break w-full shrink-0">
            <div className="flex justify-between items-center px-4 mt-2 mb-4">
                <div className="footer-copyright font-bold text-sm tracking-widest">{newspaperSettings.footerCopyright}</div>
                <div className="flex items-center gap-4">
                    <div className="flex h-4 items-center gap-12">
                        {/* Cluster 1: CMYK + Light Blue */}
                        <div className="flex gap-0 h-4">
                            <div className="w-4 h-full" style={{ backgroundColor: '#00adef' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#80d2ef' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#e5007e' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#fff200' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#000000' }}></div>
                        </div>
                        {/* Grayscale 1 */}
                        <div className="flex gap-0 h-4 rounded-full overflow-hidden">
                            <div className="w-4 h-full" style={{ backgroundColor: '#d1d2d4' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#808285' }}></div>
                        </div>

                        {/* Cluster 2: CMYK + Pink */}
                        <div className="flex gap-0 h-4">
                            <div className="w-4 h-full" style={{ backgroundColor: '#00adef' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#e5007e' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#f596c5' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#fff200' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#000000' }}></div>
                        </div>
                        {/* Grayscale 2 */}
                        <div className="flex gap-0 h-4 rounded-full overflow-hidden">
                            <div className="w-4 h-full" style={{ backgroundColor: '#d1d2d4' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#808285' }}></div>
                        </div>

                        {/* Cluster 3: CMYK + Light Yellow */}
                        <div className="flex gap-0 h-4">
                            <div className="w-4 h-full" style={{ backgroundColor: '#00adef' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#e5007e' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#fff200' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#fff999' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#000000' }}></div>
                        </div>
                        {/* Grayscale 3 */}
                        <div className="flex gap-0 h-4 rounded-full overflow-hidden">
                            <div className="w-4 h-full" style={{ backgroundColor: '#d1d2d4' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#808285' }}></div>
                        </div>

                        {/* Cluster 4: Basic CMYK + Grey */}
                        <div className="flex gap-0 h-4">
                            <div className="w-4 h-full" style={{ backgroundColor: '#00adef' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#e5007e' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#fff200' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#000000' }}></div>
                            <div className="w-4 h-full" style={{ backgroundColor: '#808285' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

    const handleDownload = async () => {
        if (!printAreaRef.current) return;
        try {
            // High resolution scale for crisp PNG downloads
            const canvas = await html2canvas(printAreaRef.current, { scale: 3, useCORS: true, logging: false });
            const link = document.createElement('a');
            link.download = `${newspaperSettings.mainLogoText}-${newspaperSettings.subText2}-Page-${currentPage}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Error generating image:", err);
            alert("చెప్పిన పేజీని డౌన్‌లోడ్ చేయడంలో విఫలమైంది.");
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `${newspaperSettings.mainLogoText} ${newspaperSettings.subText2} - E-Paper`,
            text: `${newspaperSettings.mainLogoText} ${newspaperSettings.subText2} E-Paper - Page ${currentPage}`,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(shareData.url);
                alert("URL copied to clipboard!");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    return (
        <div className="newspaper-viewer-bg">
            {/* 1. White Top Bar (Logo) */}
            <div className="epaper-header-bar no-print">
                <div className="epaper-logo-container">
                    <div className="epaper-header-logo">
                        <span className="logo-main shadow-text">{newspaperSettings.mainLogoText}</span>
                        <div className="logo-sub-wrapper">
                            <span className="logo-sub">{newspaperSettings.subText1}</span>
                            <span className="logo-badge">{newspaperSettings.subText2}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Red Navigation Bar */}
            <nav className="epaper-red-nav no-print">
                <div className="nav-container">
                    <a href="/" className="nav-link home-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                    </a>
                    <a href="#" className="nav-link">About Us</a>
                    <a href="#" className="nav-link">Contact Us</a>
                    <a href="#" className="nav-link">Privacy Policy</a>
                </div>
            </nav>

            {/* 3. Grey Toolbar */}
            <div className="epaper-grey-toolbar no-print">
                <div className="toolbar-left">
                    <select
                        value={currentPage}
                        onChange={(e) => navigate(`/newspaper/${e.target.value}`)}
                        className="toolbar-select"
                    >
                        {Math.max(1, pages.length) > 0 && Array.from({ length: Math.max(1, pages.length) }).map((_, i) => (
                            <option key={i} value={i + 1}>Page {i + 1}</option>
                        ))}
                    </select>
                    <button onClick={() => navigate(`/newspaper/${Math.min(pages.length, currentPage + 1)}`)} className="toolbar-btn btn-next">{'>'}</button>
                </div>

                <div className="toolbar-center">
                    <button className="toolbar-btn btn-pdf" onClick={handleDownloadFullPDF} disabled={pdfLoading}>
                        {pdfLoading ? '...Loading PDF' : 'PDF'}
                    </button>
                </div>

                <div className="toolbar-right">
                    <div className="btn-group-flush">
                        <button className="toolbar-btn btn-clip" onClick={() => alert('క్లిప్ ఫీచర్ త్వరలో వస్తుంది (Clip feature coming soon)')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 icon-inline"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                            Clip
                        </button>
                        <button className="toolbar-btn btn-archive" onClick={() => alert('ఆర్కైవ్ త్వరలో వస్తుంది (Archive coming soon)')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 icon-inline"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            Archive
                        </button>
                    </div>
                </div>
            </div>

            <div className="epaper-main-container">
                {/* Left Sidebar */}
                <div className="epaper-sidebar no-print">
                    <div className="sidebar-inner">
                        {pages.map((_, i) => (
                            <div key={i} className="thumbnail-wrapper">
                                <div
                                    className={`epaper-thumbnail ${currentPage === i + 1 ? 'active' : ''}`}
                                    onClick={() => navigate(`/newspaper/${i + 1}`)}
                                    title={`Go to Page ${i + 1}`}
                                >
                                    <div className="thumb-placeholder-content">
                                        <div className="thumb-header-red"></div>
                                        <div className="thumb-cols">
                                            <div className="thumb-col"></div>
                                            <div className="thumb-col"></div>
                                            <div className="thumb-col"></div>
                                            <div className="thumb-col"></div>
                                        </div>
                                    </div>
                                </div>
                                <span className="thumbnail-label">Page {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="epaper-content-area">
                    {/* The Page Title Bar with red underline */}
                    <div className="epaper-page-title-bar no-print">
                        <div className="title-wrapper">
                            <h2 className="epaper-page-title">{newspaperSettings.mainLogoText} {newspaperSettings.subText2} - {today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - Page {currentPage}</h2>
                            <div className="title-underline"></div>
                        </div>
                        <div className="epaper-page-actions">
                            <div className="btn-group-flush">
                                <button className="toolbar-btn btn-download-blue" onClick={handleDownload} title="Download Current Page">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                </button>
                                <button className="toolbar-btn btn-share-green" onClick={handleShare} title="Share Link">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="epaper-print-container" ref={printAreaRef}>

                        {loading ? (
                            <div className="newspaper-page flex flex-col items-center justify-center min-h-[500px]" style={{ display: 'flex' }}>
                                <p className="text-xl">లోడింగ్...</p>
                            </div>
                        ) : error ? (
                            <div className="newspaper-page flex flex-col items-center justify-center min-h-[500px]" style={{ display: 'flex' }}>
                                <p className="text-xl text-red-500">{error}</p>
                            </div>
                        ) : pages.length === 0 ? (
                            <div className="newspaper-page flex flex-col items-center justify-center min-h-[500px]" style={{ display: 'flex' }}>
                                <p className="text-xl">ప్రస్తుతం ఎటువంటి వార్తలు లేవు.</p>
                            </div>
                        ) : (
                            pages.map((pageData, pageIndex) => (
                                <div
                                    key={`page-${pageIndex}`}
                                    className={`newspaper-page ${currentPage === pageIndex + 1 ? 'active-page' : 'hidden-page'}`}
                                    id={`page-${pageIndex + 1}`}
                                >
                                    {/* PAGE CONTENT */}
                                    {pageData.isFrontPage ? (
                                        <>
                                            {/* Newspaper Header - Page 1 Style */}
                                            <header className="site-header">
                                                <div className="logo-section">
                                                    <div className="main-logo-box">
                                                        <div className="ad-placeholder header-top-ad no-print" title="Click to edit if needed">
                                                            <span contentEditable suppressContentEditableWarning spellCheck="false">వాణిజ్య ప్రకటన (Ad Space)</span>
                                                        </div>
                                                        <div className="main-logo-wrapper">
                                                            <span className="main-logo-text" contentEditable suppressContentEditableWarning spellCheck="false">{newspaperSettings.mainLogoText}</span>
                                                        </div>
                                                        <div className="logo-sub-text">
                                                            <span className="telugu-daily" contentEditable suppressContentEditableWarning spellCheck="false">{newspaperSettings.subText1}</span>
                                                            <span className="express-badge" contentEditable suppressContentEditableWarning spellCheck="false">{newspaperSettings.subText2}</span>
                                                        </div>
                                                    </div>

                                                    <div className="side-contact-box no-print">
                                                        <div className="wanted-heading">{newspaperSettings.wantedHeading}</div>
                                                        <div className="side-logo-title">
                                                            <span className="side-riw">{newspaperSettings.sideLogoTitlePart1}</span>
                                                            <span className="side-express">{newspaperSettings.sideLogoTitlePart2}</span>
                                                        </div>
                                                        <div className="contact-details">
                                                            {newspaperSettings.contactDetails.split('\n').map((line, i) => (
                                                                <React.Fragment key={i}>{line}<br /></React.Fragment>
                                                            ))}
                                                        </div>
                                                        <div className="contact-number-box">
                                                            <div className="contact-label">{newspaperSettings.contactLabel}</div>
                                                            <div className="contact-number">{newspaperSettings.contactNumber}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Green Meta Info Bar */}
                                                <div className="green-meta-bar">
                                                    <span>సంపుటి : {newspaperSettings.volume}</span>
                                                    <span>సంచిక : {newspaperSettings.issue}</span>
                                                    <span>ఎడిటర్: {newspaperSettings.editor}</span>
                                                    <span>పేజీలు : {newspaperSettings.pages},</span>
                                                    <span>వెల రూ. {newspaperSettings.price}</span>
                                                    <span>{dateString}</span>
                                                </div>
                                            </header>

                                            <main className="newspaper-content flex-grow">
                                                <div className="magazine-grid">
                                                    {(pageData.topFeatured && pageData.topFeatured[0]) && (
                                                        <div className="magazine-item lead">
                                                            <ArticleCard article={pageData.topFeatured[0]} gridClass="feature" onArticleClick={setZoomedArticle} />
                                                        </div>
                                                    )}
                                                    {(pageData.topFeatured && pageData.topFeatured[1]) && (
                                                        <div className="magazine-item sidebar-left">
                                                            <ArticleCard article={pageData.topFeatured[1]} gridClass="medium" onArticleClick={setZoomedArticle} />
                                                        </div>
                                                    )}
                                                    {(pageData.topFeatured && pageData.topFeatured[2]) && (
                                                        <div className="magazine-item sidebar-right">
                                                            <ArticleCard article={pageData.topFeatured[2]} gridClass="medium" onArticleClick={setZoomedArticle} />
                                                        </div>
                                                    )}
                                                    {(pageData.topFeatured && pageData.topFeatured[3]) && (
                                                        <div className="magazine-item secondary">
                                                            <ArticleCard article={pageData.topFeatured[3]} gridClass="large"  onArticleClick={setZoomedArticle} />
                                                        </div>
                                                    )}
                                                    {(pageData.topFeatured && pageData.topFeatured[4]) && (
                                                        <div className="magazine-item bottom-featured">
                                                            <ArticleCard article={pageData.topFeatured[4]} gridClass="large" onArticleClick={setZoomedArticle} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Packed Grid Box underneath the magazine layout using new CSS Column algorithm */}
                                                <LayoutEngine articles={pageData.gridItems || []} pageIndex={1} onArticleClick={setZoomedArticle} />

                                                {/* Push an Ad to the bottom to flexibly absorb any remaining whitespace */}
                                                <div className="advertisement-block flex-grow mt-4" style={{ minHeight: '60px' }}>
                                                    <span className="ad-sponsor-text">Sponsor Space Available</span>
                                                </div>
                                            </main>
                                        </>
                                    ) : (
                                        /* INNER PAGES CONTENT (Page 2, 3...) */
                                        <>
                                            <main className="newspaper-content flex-grow flex flex-col">
                                                <div className="inner-page-section flex flex-col flex-grow">
                                                    {/* INNER PAGE HEADER */}
                                                    <div className="inner-page-header no-print-break" style={{ marginBottom: '15px' }}>
                                                        <div className="inner-header-left">
                                                            <div className="page-number-box">{pageIndex + 1}</div>
                                                            <div className="inner-logo-box">
                                                                <span className="inner-logo-text">{newspaperSettings.innerLogoText}</span>
                                                            </div>
                                                        </div>
                                                        <div className="inner-header-center">
                                                            <div className="category-pill">
                                                                <span>{newspaperSettings.innerCategoryText}</span>
                                                            </div>
                                                        </div>
                                                        <div className="inner-header-right">
                                                            <div className="date-pill">
                                                                <span>{dateString}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Delegate rendering of Grid to Layout Engine */}
                                                    <div className="flex-grow">
                                                        <LayoutEngine articles={pageData.gridItems || []} pageIndex={pageIndex + 1} onArticleClick={setZoomedArticle} />
                                                    </div>

                                                    {/* Page 8 Publisher Block Element */}
                                                    {(pageIndex + 1) === 8 && (
                                                        <div className="publisher-block bg-gray-100 p-4 border border-gray-400 mt-4 text-center font-serif text-sm w-full no-print-break">
                                                            <hr className="border-black mb-2 mx-auto w-1/2" />
                                                            <p className="font-bold text-black uppercase tracking-wider mb-1">
                                                                EDITOR, Printed, Published and Owned by KOTLAPALLI FOUZIYA
                                                            </p>
                                                            <p className="text-gray-800 mb-1">
                                                                Printed at Mis FOUZIYAPUBLICATIONS, H.NO:5-1-2/14-1, Hindupur, Andhra Pradesh
                                                            </p>
                                                            <p className="font-bold text-black uppercase">
                                                                RNI Regd No APTEL/26/A0016
                                                            </p>
                                                            <hr className="border-black mt-2 mx-auto w-1/2" />
                                                        </div>
                                                    )}

                                                    {/* Push an Ad to the bottom to flexibly absorb any remaining whitespace */}
                                                    <div className="advertisement-block flex-grow mt-auto pt-4" style={{ minHeight: '60px' }}>
                                                        <span className="ad-sponsor-text">Sponsor Space Available</span>
                                                    </div>
                                                </div>
                                            </main>
                                        </>
                                    )}

                                    {/* FOOTER is added to ALL pages */}
                                    <PaperFooter pageIndex={pageIndex + 1} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ZOOM MODAL OVERLAY */}
            {zoomedArticle && (
                <div className="article-zoom-modal no-print" onClick={(e) => {
                    // Close if clicking outside the modal content
                    if (e.target.className.includes('article-zoom-modal')) setZoomedArticle(null);
                }}>
                    <div className="zoom-modal-content">
                        <button className="zoom-close-btn" onClick={() => setZoomedArticle(null)}>×</button>
                        <ArticleCard article={zoomedArticle} gridClass="feature" bgClass="bg-white" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Newspaper;
