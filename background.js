let currentProblemTitle = "";

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "leetcodeProblemTitle") {
        const newProblemTitle = message.problemTitle;

        if (newProblemTitle !== currentProblemTitle) {
            console.log("New problem detected:", newProblemTitle);
            currentProblemTitle = newProblemTitle;

            // Clear cached hints and start fetching
            chrome.storage.local.set({ problemTitle: currentProblemTitle, hints: [], algorithm: "" }, async () => {
                try {
                    console.log("Fetching hints for:", currentProblemTitle);

                    const prompt = `
                    Provide 5 step-by-step hints for solving the following LeetCode problem:
                    Title: ${currentProblemTitle}.
                    
                    Each hint should be concise, clear, and progressively guide the user from understanding the problem to an efficient solution. End by stating the algorithm or data structure used.

                    Respond with:
                    1. Hint 1
                    2. Hint 2
                    3. Hint 3
                    4. Hint 4
                    5. Hint 5
                    Algorithm: Explanation of the algorithm or data structure used without giving any further hints. Make it as short as possible containing only the keywords
                    Time Complexity: The optimal time complexity for this solution.
                    `;

                    const hints = await fetchHints(prompt);
                    chrome.storage.local.set(
                        {
                            hints: hints.steps.length > 0 ? hints.steps : ["No hint available for this problem. Try yourself. All the best!!!"],
                            algorithm: hints.algorithm || "Algorithm not available.",
                            timeComplexity: hints.timeComplexity || "Time complexity not available.",
                        },
                        () => {
                            console.log("Hints and algorithm stored successfully:", hints.steps.length > 0 ? hints.steps : ["No hint available for this problem. Try yourself. All the best!!!"]);
                        }
                    );
                    
                } catch (error) {
                    console.error("Error fetching hints:", error);
                }
            });
        }
    }
});

// Fetch hints from the backend (OpenAI/Gemini API)
async function fetchHints(prompt) {
    const { openaiApiKey, geminiApiKey } = await chrome.storage.local.get(["openaiApiKey", "geminiApiKey"]);
    const adminGeminiApiKey = "AIzaSyC7GcmQ9JEovyzln2pAURDFdrct9nZ52sY"; // Admin key

    try {
        if (openaiApiKey) {
            console.log("Using OpenAI API key for fetching hints.");
            return await fetchHintsFromOpenAI(prompt, openaiApiKey);
        } else if (geminiApiKey) {
            console.log("Using user-provided Gemini API key for fetching hints.");
            return await fetchHintsFromGemini(prompt, geminiApiKey);
        } else {
            console.log("Using admin Gemini API key for fetching hints.");
            return await fetchHintsFromGemini(prompt, adminGeminiApiKey);
        }
    } catch (error) {
        // console.error("Error in fetchHints:", error);
        return { steps: ["No hint available for this problem. Try yourself. All the best!!!"], algorithm: "Error fetching hints.", timeComplexity: "N/A" };
    }
}


// Fetch hints from OpenAI
async function fetchHintsFromOpenAI(prompt, apiKey) {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
            }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse hints, algorithm, and time complexity
        return parseHints(content);
    } catch (error) {
        // console.error("Error in fetchHintsFromOpenAI:", error);
        return { steps:  ["No hint available for this problem. Try yourself. All the best!!!"], algorithm: "Error fetching hints.", timeComplexity: "N/A" };
    }
}

// Fetch hints from Gemini
// Fetch hints from Gemini API
async function fetchHintsFromGemini(prompt, apiKey) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt, // Pass the problem prompt here
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data)
        // Assuming the response contains a field like 'contents' with the generated text
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Parse hints, algorithm, and time complexity
        return parseHints(content);
    } catch (error) {
        // console.error("Error in fetchHintsFromGemini:", error);
        return { steps: ["No hint available for this problem. Try yourself. All the best!!!"], algorithm: "Error fetching hints.", timeComplexity: "N/A" };
    }
}


// Parse hints, algorithm, and time complexity from content
function parseHints(content) {
    const steps = content
        .split("\n")
        .filter((line) => line.match(/^\d+\.\sHint/))
        .map((line) => line.replace(/^\d+\.\s/, "").trim());

    const algorithmMatch = content.match(/Algorithm:\s*(.+)/i);
    const algorithm = algorithmMatch ? algorithmMatch[1].trim() : "No specific algorithm provided.";

    const timeComplexityMatch = content.match(/Time Complexity:\s*(.+)/i);
    const timeComplexity = timeComplexityMatch ? timeComplexityMatch[1].trim() : "No specific time complexity provided.";

    return { steps, algorithm, timeComplexity };
}
