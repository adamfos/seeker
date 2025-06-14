// assets/js/search.js
async function getGoogleApiKey() {
    const response = await fetch('/api/config/google-api-key');
    const data = await response.json();
    return data.apiKey;
}

async function logSearch(query) {
    try {
        const response = await fetch('/api/log-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            console.error('Failed to log search query:', response.statusText);
        }
    } catch (error) {
        console.error('Error logging search query:', error);
    }
}



export async function generateOptimizedSearchString(userInput) {
    if (!userInput.trim()) {
        return { error: "No input provided." };
    }

    const promptText = `Act as a search engine optimization assistant that provides the most effective Google dorking string to deliver precise and accurate results. Ask for the topic or information to be searched, and then craft a highly optimized Google dork string (in plain text) tailored to the query. Ensure the string includes advanced search operators and filters for maximum relevance and accuracy. Do not provide any additional information, just give me the plain text search string. Topic: ${userInput}`;

    try {
        // Load the Google AI library from CDN
        const { GoogleGenerativeAI } = await import('https://esm.run/@google/generative-ai');
        const apiKey = await getGoogleApiKey();
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Use the correct model name
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text();

        // Log the original search query
        await logSearch(userInput);

        return { searchString: text };
    } catch (error) {
        console.error("Search error:", error);
        return { error: "Failed to generate search string. Please try again." };
    }
}

// Manual Search form handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('manualSearchForm');
  if (!form) return;
  const resultsContainer = document.getElementById('search-results');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let query = document.getElementById('manualQuery').value.trim();
    const goal = document.getElementById('searchGoal').value;
    if (goal === 'pdf') {
      query += ' filetype:pdf';
    } else if (goal === 'videos') {
      query += ' site:youtube.com';
    }
    // Launch Google search in new tab
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      '_blank'
    );
  });
});