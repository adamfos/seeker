async function submitSearch() {
    const userInput = document.getElementById("userInput").value.trim(); // Trim to remove extra spaces

    // Check if input is empty
    if (!userInput) {
        document.getElementById("result").innerText = "Please enter a valid search query.";
        return;
    }

    try {
        // Send the POST request to the Python backend
        const response = await fetch('http://127.0.0.1:5000/generate-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput })
        });

        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // Parse the JSON response

        if (data.searchString) {
            document.getElementById("result").innerText = `Generated Search String: ${data.searchString}`;
        } else {
            document.getElementById("result").innerText = `Error: ${data.error}`;
        }

    } catch (error) {
        // Catch and display any errors (e.g., network issues)
        document.getElementById("result").innerText = `Error: ${error.message}`;
    }
}