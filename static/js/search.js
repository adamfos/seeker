// assets/js/search.js

export async function generateOptimizedSearchString(userInput) {
  if (!userInput.trim()) {
      return { error: "No input provided." };
  }

  const promptText = `Act as a search engine optimization assistant that provides the most effective Google dorking string to deliver precise and accurate results. Ask for the topic or information to be searched, and then craft a highly optimized Google dork string (in plain text) tailored to the query. Ensure the string includes advanced search operators and filters for maximum relevance and accuracy. Do not provide any additional information, just give me the plain text search string. Topic: ${userInput}`;

  try {
      // Assuming you have an endpoint in Flask that handles this
      const response = await fetch('/generate-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput })
      });

      const result = await response.json();
      if (result.error) {
          return { error: result.error };
      }

      return { searchString: result.searchString };
  } catch (error) {
      console.error("Search error:", error);
      return { error: "Failed to generate search string. Please try again." };
  }
}