// assets/js/search.js
async function getGoogleApiKey() {
    const response = await fetch('/api/config/google-api-key');
    const data = await response.json();
    return data.apiKey;
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
      return { searchString: text };
    } catch (error) {
      console.error("Search error:", error);
      return { error: "Failed to generate search string. Please try again." };
    }
  }