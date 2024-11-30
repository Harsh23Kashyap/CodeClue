

let currentUrl = window.location.href;

function monitorUrlChange() {
    const observer = new MutationObserver(() => {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
            currentUrl = newUrl;
            console.log("Detected URL change:", currentUrl);

            // Check if the new URL is a problem page
            if (/https:\/\/leetcode\.com\/problems\/[\w-]+/.test(newUrl)) {
                const problemTitle = document.querySelector('div[data-cy="question-title"]')?.innerText.trim();

                // Notify background script of the new problem
                chrome.runtime.sendMessage({
                    type: "leetcodeProblemTitle",
                    problemTitle: problemTitle || "Unknown Problem",
                });
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Start monitoring URL changes
monitorUrlChange();

function extractProblemTitle() {
    const titleElement = document.querySelector('div[data-cy="question-title"]');

    if (titleElement) {
        const fullText = titleElement.innerText.trim();
        const titleMatch = fullText.match(/^\d+\.\s.+/); // Matches "1234. Problem Title"

        if (titleMatch) {
            const problemTitle = titleMatch[0];
            console.log("Extracted Problem Title:", problemTitle); // Debug log

            // Send the title to the background script
            chrome.runtime.sendMessage({ type: "leetcodeProblemTitle", problemTitle }, () => {
                console.log("Problem Title Sent:", problemTitle); // Debug log
            });
        } else {
            console.error("Problem Title Format Not Matched:", fullText);
        }
    } else {
        console.error("Problem Title Element Not Found");
    }
}

// Observe changes to dynamically loaded content
const observer = new MutationObserver(() => {
    extractProblemTitle();
});

// Start observing changes in the DOM
observer.observe(document.body, { childList: true, subtree: true });

// Extract problem details on script load
extractProblemTitle();
