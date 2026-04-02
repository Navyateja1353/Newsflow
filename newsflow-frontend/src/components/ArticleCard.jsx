import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const ArticleCard = ({ article, onArticleClick, gridClass = "medium", bgClass = "bg-white", titleClass = "", isSideImage = false, contentCols = 1 }) => {
    // Clean WhatsApp bold/italic formatting marks from text
    const cleanText = (text) => {
        if (!text) return "";
        return text.replace(/[*_~`]/g, "");
    };

    const cleanHeadline = cleanText(article.headline || article.title);
    const cleanContent = cleanText(article.content);

    // Deterministic CSS Grid masonry - Calculate row span heavily based on content to prevent jumping/moving
    const calculateRowSpan = () => {
        let baseTracks = 14;  // Average tracks for a standard block
        if (gridClass === 'banner') baseTracks = 12; // Banners are wide but short
        if (gridClass === 'feature') baseTracks = 18; // Feature boxes are tall
        if (gridClass === 'medium') baseTracks = 16;
        if (gridClass === 'small') baseTracks = 16;
        
        let hasImage = false;
        if (article.image_url && article.image_url.trim() !== "") {
            hasImage = true;
            // Add track heights for images depending on layout width
            if (gridClass === 'small') baseTracks += 7;
            if (gridClass === 'medium' && !isSideImage) baseTracks += 10;
            if (gridClass === 'feature' && !isSideImage) baseTracks += 14;
        }

        // Add tracks based on character count thresholds to accommodate varying article lengths
        const charLen = cleanContent.length;
        if (charLen > 200) baseTracks += 3;
        if (charLen > 500) baseTracks += 4;
        if (charLen > 800) baseTracks += 4;
        
        return `span ${baseTracks}`;
    };
    
    const rowSpan = calculateRowSpan();

    // Only show an image if one was downloaded successfully to the local server
    let fullImageUrl = null;
    if (article.image_url && article.image_url.trim() !== "") {
        if (!article.image_url.includes('api.twilio.com')) {
            fullImageUrl = article.image_url.startsWith('http') ? article.image_url : `http://localhost:3000${article.image_url}`;
        }
    }

    // Extract gist from content (e.g. first ~100 chars or first logical break)
    const gist = cleanContent.length > 80 
        ? cleanContent.substring(0, 80).split(' ').slice(0, -1).join(' ') + '...' 
        : cleanContent;

    return (
        <article 
            className={`news-block ${gridClass} ${bgClass} cursor-pointer relative`} 
            style={{ gridRowEnd: rowSpan }}
            onClick={(e) => onArticleClick && onArticleClick(article, e)}
            title="Zoom in"
        >
            <div className="article-inner flex flex-col h-full w-full">
            {/* 1. Title always comes first */}
            <div className={`article-header-group header-${gridClass}`}>
                <h2 className={`article-title title-${gridClass} ${titleClass}`}>{cleanHeadline}</h2>
            </div>

            {/* 1.5 The Hindu Style: Gist & QR Code below Title for Lead/Important Stories */}
            {(gridClass === 'banner' || gridClass === 'feature') && (
                <div className="article-meta-row flex justify-between items-center mb-2 border-b-2 border-gray-800 pb-2 mt-1">
                    <div className="article-gist font-bold text-gray-800 pr-2 text-sm italic leading-snug">
                        "{gist}"
                    </div>
                    {gridClass === 'banner' && (
                        <div className="qr-code-wrapper flex flex-col items-center border-l-2 border-gray-300 pl-3 ml-2 shrink-0">
                            <QRCodeSVG value={`http://localhost:3000/news/${article.id}`} size={46} />
                            <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter leading-tight text-center">Scan to<br/>Read</span>
                        </div>
                    )}
                </div>
            )}

            {/* 2. Content Body (With optional side image layout) */}
            <div className={`article-body-wrapper ${isSideImage ? 'layout-side-image' : 'layout-stacked'}`}>
                {fullImageUrl && (
                    <div className="article-image-container">
                        <img
                            src={fullImageUrl}
                            alt={cleanHeadline}
                            className="article-img"
                            onError={(e) => { e.target.closest('.article-image-container').style.display = 'none'; }}
                        />
                    </div>
                )}

                {/* 3. Text content */}
                <div 
                    className="article-content"
                    style={{ 
                        columnCount: contentCols > 1 ? contentCols : 'auto', 
                        columnGap: contentCols > 1 ? '20px' : 'normal' 
                    }}
                >
                    {article.category && article.category !== 'సాధారణ' && (
                        <span className="inline-category-tag">{article.category}</span>
                    )}
                    {cleanContent}
                </div>
            </div>
            </div>
        </article>
    );
};

export default ArticleCard;
