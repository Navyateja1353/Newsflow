const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5176/newspaper/3', { waitUntil: 'networkidle' });
    
    const dimensions = await page.evaluate(() => {
        const result = {};
        
        ['.newspaper-page', '.newspaper-content', '.dynamic-news-masonry', '.advertisement-block', 'footer'].forEach(sel => {
            const el = document.querySelector(sel);
            if (el) {
                const rect = el.getBoundingClientRect();
                result[sel] = {
                    height: rect.height,
                    bottom: rect.bottom,
                    top: rect.top,
                    scrollHeight: el.scrollHeight
                };
            } else {
                result[sel] = "NOT FOUND";
            }
        });
        
        result['total_articles_height'] = Array.from(document.querySelectorAll('.news-masonry-item')).reduce((acc, el) => acc + el.getBoundingClientRect().height, 0);
        
        return result;
    });
    
    console.log(JSON.stringify(dimensions, null, 2));
    
  } catch (e) {
      console.error(e);
  } finally {
      await browser.close();
  }
})();
