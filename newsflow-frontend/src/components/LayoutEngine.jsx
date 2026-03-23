import React from 'react';
import ArticleCard from './ArticleCard';

// Real CSS Masonry Algorithm 
// This container relies on CSS `column-count: 4` to pour text continuously downwards.
// It mathematically guarantees 0 gaps because blocks simply stack on top of the previous one in that column.
const LayoutEngine = ({ articles, pageIndex, onArticleClick }) => {
    
    // Priority Ranking Sorting Algorithm
    const prioritySortedArticles = [...articles].sort((a, b) => {
        // Categories like 'Lead' get highest priority
        const aIsLead = a.category === 'Lead' || a.category === 'ముఖ్య వార్తలు';
        const bIsLead = b.category === 'Lead' || b.category === 'ముఖ్య వార్తలు';
        if (aIsLead && !bIsLead) return -1;
        if (!aIsLead && bIsLead) return 1;

        // Otherwise sort by content length (proxy for importance if no other metric)
        const aLength = a.content ? a.content.length : 0;
        const bLength = b.content ? b.content.length : 0;
        
        // Boost if they have an image
        const aBoost = a.image_url && a.image_url.trim() !== "" ? 500 : 0;
        const bBoost = b.image_url && b.image_url.trim() !== "" ? 500 : 0;
        
        return (bLength + bBoost) - (aLength + aBoost);
    });

    // CSS Multi-column doesn't use row-packing. Items simply stack inside columns natively.
    // We only selectively apply column-span: all (.col-span-3) for very massive articles.
    
    return (
        <div className="dynamic-news-masonry">
            {prioritySortedArticles.map((article, idx) => {
                const bgClass = idx % 2 === 0 ? 'bg-light-gray' : 'bg-white';
                
                let titleClass = "";
                let isSideImage = false;
                let activeSpan = 1;
                let activeCols = 1;

                const charCount = article.content ? article.content.length : 0;
                
                if (idx === 0 && pageIndex === 1) {
                    titleClass = 'title-bg-red';
                    isSideImage = true;
                    activeSpan = 3; // Enforces column-span: all 
                    activeCols = 3; // Splits internal contents into 3 columns
                } else if (charCount > 1500) {
                    titleClass = 'title-bg-blue';
                    if (article.image_url) isSideImage = true;
                    activeSpan = 3;
                    activeCols = 3;
                } else if (charCount > 600) {
                    titleClass = 'title-bg-green';
                    if (article.image_url) isSideImage = true;
                    // Let it flow normally within 1 of the 3 columns
                }

                let spanClass = activeSpan === 3 ? 'col-span-3' : '';

                return (
                    <div key={`${article.id}-${pageIndex}-${idx}`} className={`news-masonry-item ${spanClass}`}>
                        <ArticleCard 
                            article={article} 
                            bgClass={bgClass} 
                            titleClass={titleClass}
                            isSideImage={isSideImage}
                            contentCols={activeCols}
                            onArticleClick={onArticleClick} 
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default LayoutEngine;
