# assets/py/search.py

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

def generate_optimized_search_string(user_input):
    if not user_input.strip():
        return { "error": "No input provided." }

    prompt_text = f"""Act as a search engine optimization assistant that provides the most effective Google dorking string to deliver precise and accurate results. 
    Ask for the topic or information to be searched, and then craft a highly optimized Google dork string (in plain text) tailored to the query. 
    Ensure the string includes advanced search operators and filters for maximum relevance and accuracy. 
    Do not provide any additional information, just give me the plain text search string. 
    Topic: {user_input}"""

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')  # Use the correct model name here
        response = model.generate_content(prompt_text)
        text = response.text
        return { "searchString": text }
    except Exception as e:
        print("Search error:", e)
        return { "error": "Failed to generate search string. Please try again." }