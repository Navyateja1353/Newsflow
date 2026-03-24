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

    // Height estimation for balancing columns
    const estimateHeight = (article) => {
        let height = 50; 
        const headline = article.headline || article.title || "";
        height += Math.ceil(headline.length / 30) * 28; 
        if (article.image_url) height += 220; 
        const content = article.content || "";
        height += Math.ceil(content.length / 45) * 22; 
        return height;
    };

    // Distribute into 3 explicit columns for html2canvas safety
    const numCols = 3;
    const columns = Array.from({ length: numCols }, () => []);
    const colHeights = Array(numCols).fill(0);

    prioritySortedArticles.forEach((article, idx) => {
        let titleClass = "";
        let isSideImage = false;
        const charCount = article.content ? article.content.length : 0;
        
        if (idx === 0 && pageIndex === 1) {
            titleClass = 'title-bg-red';
            isSideImage = true;
        } else if (charCount > 1500) {
            titleClass = 'title-bg-blue';
            if (article.image_url) isSideImage = true;
        } else if (charCount > 600) {
            titleClass = 'title-bg-green';
            if (article.image_url) isSideImage = true;
        }

        const shortestColIdx = colHeights.indexOf(Math.min(...colHeights));
        
        columns[shortestColIdx].push(
            <div key={`${article.id}-${pageIndex}-${idx}`} className="news-masonry-item" style={{ marginBottom: "15px" }}>
                <ArticleCard 
                    article={article} 
                    bgClass={idx % 2 === 0 ? 'bg-light-gray' : 'bg-white'} 
                    titleClass={titleClass}
                    isSideImage={isSideImage}
                    contentCols={1} // Keep internals simple
                    onArticleClick={onArticleClick} 
                />
            </div>
        );
        
        colHeights[shortestColIdx] += estimateHeight(article);
    });

    return (
        <div className="dynamic-news-masonry flex-masonry">
            {columns.map((colItems, colIdx) => (
                <div key={`col-${colIdx}`} className="masonry-flex-col">
                    {colItems}
                </div>
            ))}
        </div>
    );
};

export default LayoutEngine;
