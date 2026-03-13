import React from 'react';
import ArticleCard from './ArticleCard';

// 5-Column Grid Layout Templates (Using exact terminology: banner=5, feature=3, medium=2, small=1)
// These templates define the visual hierarchy and size distribution of a page.
// The CSS `grid-auto-flow: dense` handles the actual "Tetris-like" physical placement.
export const PAGE_PATTERNS = [
    // 1. Top Heavy Classic (~24 articles)
    ['banner', 'feature', 'medium', 'medium', 'small', 'medium', 'small', 'small', 'small', 'small', 'small', 'feature', 'small', 'small', 'medium', 'medium', 'small', 'small', 'feature', 'small', 'medium', 'small', 'small', 'small'],
    // 2. Magazine Style Base (~26 articles)
    ['medium', 'feature', 'small', 'small', 'small', 'small', 'small', 'medium', 'medium', 'small', 'feature', 'medium', 'small', 'small', 'feature', 'medium', 'small', 'medium', 'small', 'small', 'small', 'small', 'small', 'banner', 'small', 'small'],
    // 3. Balanced Mix (~24 articles)
    ['feature', 'small', 'small', 'small', 'feature', 'small', 'medium', 'medium', 'small', 'medium', 'small', 'medium', 'small', 'small', 'small', 'small', 'small', 'feature', 'medium', 'medium', 'feature', 'small', 'medium', 'medium'],
    // 4. Briefs Heavy Bottom (~25 articles)
    ['banner', 'medium', 'feature', 'feature', 'medium', 'medium', 'medium', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small'],
    // 5. Features Mixed (~18 articles)
    ['feature', 'medium', 'medium', 'feature', 'feature', 'small', 'small', 'small', 'small', 'feature', 'medium', 'medium', 'small', 'small', 'medium', 'medium', 'banner', 'small'],
    // 6. News Dense (~28 articles)
    ['medium', 'medium', 'small', 'medium', 'small', 'medium', 'small', 'medium', 'medium', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'medium', 'medium', 'small', 'medium', 'small', 'medium', 'feature', 'medium', 'small'],
    // 7. Sidebar Heavy (~20 articles)
    ['medium', 'feature', 'medium', 'small', 'small', 'small', 'medium', 'feature', 'medium', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'banner', 'medium', 'small'],
    // 8. Even Distribution (~25 articles)
    ['feature', 'medium', 'medium', 'medium', 'small', 'small', 'small', 'small', 'small', 'small', 'feature', 'small', 'small', 'small', 'medium', 'medium', 'medium', 'small', 'medium', 'small', 'feature', 'small', 'banner', 'small', 'small'],
];

const LayoutEngine = ({ articles, pageIndex, overridePattern, onArticleClick }) => {
    
    // Pick the pattern
    const pattern = overridePattern || PAGE_PATTERNS[(pageIndex - 1) % PAGE_PATTERNS.length];

    // Priority Ranking Sorting Algorithm
    // The user requested: "Implement article priority ranking"
    // We sort the articles so the most important pieces land in the 'banner' and 'feature' slots that appear first in templates.
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

    return (
        <div className="dynamic-news-grid">
            {prioritySortedArticles.map((article, idx) => {
                const assignedShape = pattern[idx % pattern.length];
                const bgClass = idx % 2 === 0 ? 'bg-light-gray' : 'bg-white';
                
                // Colorize titles randomly for variety based on column width
                let titleClass = "";
                if (assignedShape === 'banner') titleClass = "title-bg-red";
                else if (assignedShape === 'feature') titleClass = "title-bg-blue";

                // Layout variations
                // Medium/feature elements sometimes look good with side images if text is long enough
                const isSideImage = (assignedShape === 'feature' || assignedShape === 'banner') && article.content && article.content.length > 200;

                return (
                    <ArticleCard 
                        key={`${article.id}-${pageIndex}-${idx}`} 
                        article={article} 
                        gridClass={assignedShape} 
                        bgClass={bgClass} 
                        titleClass={titleClass}
                        isSideImage={isSideImage}
                        onArticleClick={onArticleClick} 
                    />
                );
            })}
        </div>
    );
};

export default LayoutEngine;
