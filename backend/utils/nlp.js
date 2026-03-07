const natural = require('natural');

// Initialize natural language processing components
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

// Categories for Telugu
const newsCategories = {
    'ప్రధాన వార్తలు': ['రాష్ట్ర', 'ప్రభుత్వ', 'ముఖ్యమంత్రి', 'మంత్రి', 'నియామక', 'పార్లమెంట్', 'ప్రభుత్వం'],
    'వాతావరణం': ['వర్షం', 'వర్షాలు', 'వాతావరణ', 'వాయు', 'ఉష్ణోగ్రత', 'చలి', 'వేడి', 'వరద', 'వాన'],
    'క్రీడలు': ['క్రికెట్', 'ఫుట్‌బాల్', 'ఆట', 'మ్యాచ్', 'టోర్నమెంట్', 'చాంపియన్', 'టీం', 'ప్లేయర్'],
    'వ్యాపారం': ['బజార్', 'శేర్లు', 'వ్యాపార', 'ధర', 'ఆదాయ', 'లాభం', 'నష్టం', 'ఆర్థిక', 'స్టాక్'],
    'ఆరోగ్యం': ['ఆరోగ్య', 'ఆసుపత్రి', 'డాక్టర్', 'మందు', 'కరోనా', 'వైరస్', 'చికిత్స', 'హెల్త్'],
    'విద్య': ['పాఠశాల', 'కళాశాల', 'విద్య', 'పరీక్ష', 'రిజల్ట్స్', 'అడ్మిషన్', 'విద్యార్థి', 'స్కూల్'],
    'వినోదం': ['సినిమా', 'నటుడు', 'నటి', 'చిత్రం', 'గీతం', 'సంగీత', 'డాన్స్', 'నృత్య', 'మూవీ'],
    'అత్యవసరం': ['ప్రమాదం', 'దుర్ఘటన', 'అగ్ని', 'రహదారి', 'అపఘాత', 'హత్య', 'మరణ', 'పోలీస్', 'యాక్సిడెంట్'],
    'వ్యవసాయం': ['రైతు', 'పంట', 'నీరు', 'బియ్యం', 'గోధుమ', 'సారం', 'ఫలితం'],
    'సాంకేతిక': ['మొబైల్', 'కంప్యూటర్', 'ఇంటర్నెట్', 'అప్లికేషన్', 'సాఫ్ట్‌వేర్', 'ఆన్‌లైన్', 'టెక్నాలజీ']
};

/**
 * Generates a headline from Telugu news text
 */
function generateHeadline(text) {
    if (!text || text.trim() === '') return "స్థానిక వార్తలు";

    // Standardize input
    const cleanText = text.trim();

    // Strategy 1: Find the first sentence (ends with space, newline, or punctuation)
    const firstSentenceMatch = cleanText.match(/^.*?[.!?\n]/);

    let firstSentence = "";
    if (firstSentenceMatch) {
        firstSentence = firstSentenceMatch[0].trim();
    } else {
        // If no punctuation, take first 50 chars
        firstSentence = cleanText.substring(0, 50);
    }

    // Clean up punctuation from the end
    firstSentence = firstSentence.replace(/[.!?]+$/, '').trim();

    // Strategy 2: If the first sentence is too long, take the first 8-10 words
    const words = firstSentence.split(/\s+/);

    if (words.length > 12) {
        return "బ్రేకింగ్: " + words.slice(0, 10).join(' ') + "...";
    }

    // Default formatting
    return firstSentence.length > 0 ? firstSentence : "తాజా వార్తలు";
}

/**
 * Determines the category of a Telugu news article based on keywords
 */
function determineCategory(text) {
    if (!text) return 'సాధారణ';

    // Tokenize text for basic keyword matching
    // Note: WordTokenizer might not be perfect for Telugu, so we supplement it
    const words = tokenizer.tokenize(text.toLowerCase());

    // We also use simple includes for languages where tokenization is tricky
    const lowerText = text.toLowerCase();

    let maxScore = 0;
    let bestCategory = 'సాధారణ';
    const categoryScores = {};

    // Calculate score for each category
    for (const [category, keywords] of Object.entries(newsCategories)) {
        let score = 0;

        for (const keyword of keywords) {
            // Check direct inclusion since tokenization might not split Telugu perfectly
            if (lowerText.includes(keyword)) {
                // Determine frequency
                const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
                score += count * 2; // Weight exact includes higher
            }
        }

        categoryScores[category] = score;

        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }

    // Return 'సాధారణ' (General) if no strong correlation
    return maxScore > 0 ? bestCategory : 'సాధారణ';
}

/**
 * Extracts key phrases for tagging
 */
function extractKeywords(text) {
    if (!text) return [];

    const tfidf = new TfIdf();
    tfidf.addDocument(text);

    const keywords = [];

    // Fallback simple extraction for Telugu if TfIdf results are poor
    const words = text.split(/\s+/).filter(word => word.length > 3);
    const wordCounts = {};

    words.forEach(word => {
        // Clean basic punctuation
        const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
        if (cleanWord.length > 3) {
            wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
        }
    });

    // Sort by frequency
    const sortedWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);

    return sortedWords.length > 0 ? sortedWords : ['వార్తలు'];
}

module.exports = {
    generateHeadline,
    determineCategory,
    extractKeywords,
    newsCategories
};
