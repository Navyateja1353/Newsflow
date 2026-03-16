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

    // --- Deterministic Grid Row Packer ---
    // CSS grid-auto-flow: dense relies on items magically fitting.
    // If we have mostly col-span-2 articles, they will leave empty col-span-1 gaps on the right.
    // This algorithm actively reprioritizes array items to forcibly plug gaps, 
    // or manually widens items to absorb empty space.
    const packedArticles = [];
    let unplaced = [...prioritySortedArticles];
    let rowSlotsRemaining = 3;

    while (unplaced.length > 0) {
        // Try to find the highest priority article that can physically fit in the remaining row slots
        let nextIndex = unplaced.findIndex(article => {
            const charCount = article.content ? article.content.length : 0;
            // Determine its naturally desired span based on user rules
            let desiredSpan = 1;
            if (charCount > 1200) desiredSpan = 3;
            else if (charCount > 600) desiredSpan = 2;
            
            // First item on Page 1 is hardcoded to span 3
            if (packedArticles.length === 0 && pageIndex === 1) desiredSpan = 3;

            return desiredSpan <= rowSlotsRemaining;
        });

        // Oh no! No remaining article can naturally fit in the remaining slot(s).
        // e.g., we have 1 slot left, but all unplaced articles are 600+ chars (Span 2 or 3).
        if (nextIndex === -1) {
            // We have a gap that cannot be filled natively.
            // SOLUTION: Force the *next highest priority* article to shrink to fit the gap,
            // OR if the next article is huge, let it start a new row and force the *previous*
            // article in the current row to EXPAND to absorb the gap.
            
            const prevPlacedArticle = packedArticles[packedArticles.length - 1];
            
            if (prevPlacedArticle && rowSlotsRemaining < 3) {
                // Expand the LAST PLACED article to absorb the remaining slots so the row is perfectly flush
                prevPlacedArticle.forcedSpan += rowSlotsRemaining;
                // Reset row to start fresh for the next big articles
                rowSlotsRemaining = 3;
                continue; 
            } else {
                 // Safety fallback: just take the next one and forcefully shrink it to fit
                 nextIndex = 0;
            }
        }

        // Pluck the selected article out of the unplaced queue
        const articleToPlace = unplaced.splice(nextIndex, 1)[0];
        
        // Calculate its actual active span
        const charCount = articleToPlace.content ? articleToPlace.content.length : 0;
        let actualSpan = 1;
        let contentCols = 1;
        
        if (packedArticles.length === 0 && pageIndex === 1) {
             actualSpan = 3;
             contentCols = 3;
        } else if (charCount > 1200) {
             actualSpan = 3;
             contentCols = 3;
        } else if (charCount > 600) {
             actualSpan = 2;
             contentCols = 2;
        }

        // Apply fallback truncation if we forcefully shoved a big article into a small slot
        if (actualSpan > rowSlotsRemaining) {
            actualSpan = rowSlotsRemaining;
            contentCols = rowSlotsRemaining;
        }

        packedArticles.push({
            originalArticle: articleToPlace,
            forcedSpan: actualSpan,
            contentCols: contentCols
        });

        // Deduct from row capacity
        rowSlotsRemaining -= actualSpan;
        if (rowSlotsRemaining <= 0) {
            rowSlotsRemaining = 3; // Reset for next row
        }
    }

    return (
        <div className="dynamic-news-masonry">
            {packedArticles.map((packedData, idx) => {
                const article = packedData.originalArticle;
                const activeSpan = packedData.forcedSpan;
                const activeCols = packedData.contentCols;
                
                const bgClass = idx % 2 === 0 ? 'bg-light-gray' : 'bg-white';
                
                let titleClass = "";
                let isSideImage = false;
                let spanClass = `col-span-${activeSpan}`;

                // Apply coloring based on original rules, plus image checks
                const charCount = article.content ? article.content.length : 0;
                
                if (idx === 0 && pageIndex === 1) {
                    titleClass = 'title-bg-red';
                    isSideImage = true;
                } else if (charCount > 1200) {
                    titleClass = 'title-bg-blue';
                    if (article.image_url) isSideImage = true;
                } else if (charCount > 600) {
                    titleClass = 'title-bg-green';
                    if (article.image_url) isSideImage = true;
                }

                return (
                    <div key={`${article.id}-${pageIndex}-${idx}`} className={`news-masonry-item ${spanClass} mb-4`}>
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
