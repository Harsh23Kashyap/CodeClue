document.addEventListener("DOMContentLoaded", () => {
    const apiKeyContainer = document.getElementById("api-key-container");
    const mainContainer = document.getElementById("main-container");
    const saveApiKeysButton = document.getElementById("save-api-keys");
    const ignoreApiKeysButton = document.getElementById("ignore-api-keys");
    const openaiApiKeyInput = document.getElementById("openai-api-key");
    const geminiApiKeyInput = document.getElementById("gemini-api-key");

    const loadingContainer = document.getElementById("loading-container");
    const hintContainer = document.getElementById("hint-container");
    const hintBox = document.getElementById("hint-box");
    const algorithmContainer = document.getElementById("algorithm-container");
    const problemTitleElement = document.getElementById("problem-title");
    const revealAlgorithmButton = document.getElementById("reveal-algorithm");
    const revealTimeComplexityButton = document.getElementById("reveal-time-complexity");
    const algorithmElement = document.getElementById("algorithm");
    const timeComplexityElement = document.getElementById("time-complexity");
    const prevHintButton = document.getElementById("prev-hint");
    const nextHintButton = document.getElementById("next-hint");
    const showHintButton = document.getElementById("show-hint");
    const hintText = document.getElementById("hint");

    let currentHintIndex = 0;
    let hintsArray = [];

    // Check if API keys are already saved
    chrome.storage.local.get(["openaiApiKey", "geminiApiKey", "setupCompleted"], (result) => {
        if (result.setupCompleted) {
            // If setup is completed, show main container
            showMainContainer();
        } else {
            // Otherwise, show the API key setup container
            apiKeyContainer.style.display = "block";
        }
    });

    // Save API keys and mark setup as complete
    saveApiKeysButton.addEventListener("click", () => {
        const openaiApiKey = openaiApiKeyInput.value.trim();
        const geminiApiKey = geminiApiKeyInput.value.trim();

        // Save API keys to storage
        chrome.storage.local.set(
            { openaiApiKey, geminiApiKey, setupCompleted: true },
            () => {
                console.log("API keys saved and setup marked as complete.");
                apiKeyContainer.style.display = "none";
                showMainContainer();
            }
        );
    });

    // Ignore API keys and mark setup as complete
    ignoreApiKeysButton.addEventListener("click", () => {
        chrome.storage.local.set({ setupCompleted: true }, () => {
            console.log("Setup marked as complete without API keys.");
            apiKeyContainer.style.display = "none";
            showMainContainer();
        });
    });

    // Show main container and initialize functionality
    function showMainContainer() {
        mainContainer.style.display = "block";

        // Fetch problem data from storage
        chrome.storage.local.get(["problemTitle", "hints", "algorithm", "timeComplexity"], (result) => {
            const rawProblemTitle = result.problemTitle || "Problem Title Not Found";
            const problemTitle = rawProblemTitle.replace(/^\d+\.\s*/, ""); // Remove number and dot from title
            problemTitleElement.innerText = problemTitle;

            if (result.hints && result.hints.length > 0) {
                hintsArray = cleanHints(result.hints);
                showHints(hintsArray, result.algorithm, result.timeComplexity);
            } else {
                // Fetch hints from background script if not available
                loadingContainer.style.display = "block";
                chrome.runtime.sendMessage({ type: "fetchHints" }, (response) => {
                    if (response && response.hints && response.hints.length > 0) {
                        hintsArray = cleanHints(response.hints);
                        showHints(hintsArray, response.algorithm, response.timeComplexity);
                    } else {
                    // Display the animated dots in the loading message
                    loadingContainer.innerHTML = `
                    <p>
                    Fetching Hints
                    <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                </p>
                <p style="font-size: 12px; color: #cccccc;">Come back in a while</p>
                
                    `;
                    }
                });
            }
        });
    }

    // Utility function to clean hint prefixes
    function cleanHints(hints) {
        return hints.map((hint) => hint.replace(/^Hint\s\d+:\s*/, "").trim());
    }
    function showHints(hints, algorithm, timeComplexity) {
        // Hide loading screen
        loadingContainer.style.display = "none";
    
        // Show hint container and reveal buttons
        hintContainer.style.display = "block";
        algorithmContainer.style.display = "block";
    
        // Set algorithm and time complexity text
        algorithmElement.innerText = algorithm || "Algorithm not available.";
        timeComplexityElement.innerText = timeComplexity || "Time complexity not available.";
    
        // Check if hints are available
        if (hints.length > 0) {
            hintsArray = hints; // Save hints to global array for navigation
            showHintButton.addEventListener("click", (event) => {
                event.preventDefault();
                hintBox.style.display = "block"; // Show the bordered hint box
                showHintButton.style.display = "none";
                document.querySelector(".navigation-buttons").style.display = "flex";
                updateHint(currentHintIndex);
            });
    
            // Event listeners for navigation buttons
            prevHintButton.addEventListener("click", () => {
                if (currentHintIndex > 0) {
                    currentHintIndex--;
                    updateHint(currentHintIndex);
                }
            });
    
            nextHintButton.addEventListener("click", () => {
                if (currentHintIndex < hintsArray.length - 1) {
                    currentHintIndex++;
                    updateHint(currentHintIndex);
                }
            });
        } else {
            // No hints available
            showHintButton.style.display = "none";
            hintBox.style.display = "block";
            hintText.innerText = "No hints available for this problem.";
            document.querySelector(".navigation-buttons").style.display = "none"; // Hide navigation buttons
        }
    
        // Reveal algorithm on button click
        revealAlgorithmButton.addEventListener("click", (event) => {
            event.preventDefault();
            revealAlgorithmButton.style.display = "none";
            algorithmElement.style.display = "block";
        });
    
        // Reveal time complexity on button click
        revealTimeComplexityButton.addEventListener("click", (event) => {
            event.preventDefault();
            revealTimeComplexityButton.style.display = "none";
            timeComplexityElement.style.display = "block";
        });
    }
    
    // Update the hint content inside the bordered box
    function updateHint(index) {
        if (hintsArray.length === 0) {
            hintText.innerText = "No hints available.";
            return;
        }
    
        hintText.innerText = hintsArray[index];
    
        // Update navigation button visibility
        prevHintButton.style.display = index > 0 ? "inline-block" : "none";
        nextHintButton.style.display = index < hintsArray.length - 1 ? "inline-block" : "none";
    }
    
});
