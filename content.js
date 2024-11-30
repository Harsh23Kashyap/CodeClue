

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
    // Selector for the newer version of LeetCode
    const newTitleElement = document.querySelector(
        'a.no-underline.hover\\:text-blue-s.dark\\:hover\\:text-dark-blue-s.truncate.cursor-text.whitespace-normal'
    );

    // Selector for the older version of LeetCode
    const oldTitleElement = document.querySelector('div[data-cy="question-title"]');

    let problemTitle = null;

    if (newTitleElement) {
        // Extract the title for the newer version
        const fullText = newTitleElement.innerText.trim();
        const titleMatch = fullText.match(/^\d+\.\s.+/); // Matches "3319. Problem Title"
        problemTitle = titleMatch ? titleMatch[0] : null;
    } else if (oldTitleElement) {
        // Extract the title for the older version
        const fullText = oldTitleElement.innerText.trim();
        const titleMatch = fullText.match(/^\d+\.\s.+/); // Matches "1234. Problem Title"
        problemTitle = titleMatch ? titleMatch[0] : null;
    }

    if (problemTitle) {
        console.log("Extracted Problem Title:", problemTitle);

        // Send the title to the background script
        chrome.runtime.sendMessage({ type: "leetcodeProblemTitle", problemTitle }, () => {
            console.log("Problem Title Sent:", problemTitle);
        });
    } else {
        console.error("Problem Title not found or format not matched.");
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
