chrome.webNavigation.onCompleted.addListener(
    function (details) {
        if (details.url.includes("google.com/search")) {
            chrome.tabs.sendMessage(details.tabId, {
                action: "fetchPerplexityResults",
            });
        }
    },
    { url: [{ hostContains: "google.com" }] }
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "getPerplexityResults") {
        const searchQuery = request.query;

        // Create a new tab with Perplexity search
        chrome.tabs.create(
            {
                url: `https://www.perplexity.ai/search?q=${encodeURIComponent(
                    searchQuery
                )}`,
                active: false,
            },
            function (tab) {
                // We'll listen for this tab to complete loading
                const perplexityTabId = tab.id;

                // Function to check if Perplexity has loaded results
                function checkPerplexityTab() {
                    chrome.scripting.executeScript(
                        {
                            target: { tabId: perplexityTabId },
                            function: getPerplexityContent,
                        },
                        (results) => {
                            if (results && results[0] && results[0].result) {
                                // We have results, send them back to Google tab
                                chrome.tabs.sendMessage(sender.tab.id, {
                                    action: "displayPerplexityResults",
                                    results: results[0].result,
                                });

                                // Close the Perplexity tab
                                setTimeout(() => {
                                    chrome.tabs.remove(perplexityTabId);
                                }, 500);
                            } else {
                                // Check again in a moment
                                setTimeout(checkPerplexityTab, 1000);
                            }
                        }
                    );
                }

                // Start checking after a brief delay to let the page load
                setTimeout(checkPerplexityTab, 3000);
            }
        );

        // Let the sender know we're processing their request
        sendResponse({ status: "processing" });
        return true;
    }
});

// Function to extract content from Perplexity page
function getPerplexityContent() {
    // This function runs in the context of the Perplexity tab

    // Check if we're logged in
    const isLoggedIn =
        document.querySelector('[aria-label="User menu"]') !== null;

    // Check if the results are loaded
    const mainAnswer = document.querySelector(".prose");

    if (!isLoggedIn) {
        return { error: "Not logged in to Perplexity" };
    }

    if (!mainAnswer) {
        return null; // Results not ready yet
    }

    // Extract the main answer
    const answerText = mainAnswer.innerHTML;

    // Extract sources if available
    const sources = Array.from(
        document.querySelectorAll("[data-citation-index]")
    )
        .map((el) => {
            const sourceEl = el.closest("a");
            return sourceEl
                ? {
                      text: sourceEl.textContent,
                      url: sourceEl.href,
                  }
                : null;
        })
        .filter(Boolean);

    return {
        answerHtml: answerText,
        sources: sources,
        timestamp: new Date().toISOString(),
    };
}
