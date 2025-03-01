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
                                // Save login status if detected
                                if (results[0].result.isLoggedIn === true) {
                                    chrome.storage.local.set({
                                        perplexityLoginStatus: "loggedIn",
                                        lastCheck: new Date().toISOString(),
                                    });
                                }

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

                // Start checking after a longer delay to let the page load
                setTimeout(checkPerplexityTab, 5000);
            }
        );

        // Let the sender know we're processing their request
        sendResponse({ status: "processing" });
        return true;
    }

    // Add a new message handler for explicit login checks
    if (request.action === "checkPerplexityLogin") {
        chrome.scripting.executeScript(
            {
                target: { tabId: request.tabId },
                function: checkLoginStatus,
            },
            (results) => {
                if (results && results[0] && results[0].result) {
                    chrome.storage.local.set({
                        perplexityLoginStatus: results[0].result.isLoggedIn
                            ? "loggedIn"
                            : "notLoggedIn",
                        lastCheck: new Date().toISOString(),
                    });
                }
            }
        );
        return true;
    }
});

// Function to just check login status
function checkLoginStatus() {
    // Try multiple selectors that might indicate login status
    const userMenuPresent =
        document.querySelector('[aria-label="User menu"]') !== null;
    const userAvatarPresent =
        document.querySelector('[alt="User Avatar"]') !== null;
    const signInButtonAbsent =
        document.querySelector('[aria-label="Sign In"]') === null;

    // Consider logged in if any positive indicators are found
    const isLoggedIn =
        userMenuPresent || userAvatarPresent || signInButtonAbsent;

    return { isLoggedIn: isLoggedIn };
}

// Function to extract content from Perplexity page
function getPerplexityContent() {
    // This function runs in the context of the Perplexity tab

    // Check if we're logged in using multiple possible indicators
    const userMenuPresent =
        document.querySelector('[aria-label="User menu"]') !== null;
    const userAvatarPresent =
        document.querySelector('[alt="User Avatar"]') !== null;
    const signInButtonAbsent =
        document.querySelector('[aria-label="Sign In"]') === null;

    // Consider logged in if any positive indicators are found
    const isLoggedIn =
        userMenuPresent || userAvatarPresent || signInButtonAbsent;

    // Check if the results are loaded
    const mainAnswer = document.querySelector(".prose");

    if (!isLoggedIn) {
        return {
            error: "Not logged in to Perplexity",
            isLoggedIn: false,
        };
    }

    if (!mainAnswer) {
        return null; // Results not ready yet
    }

    // Function to convert Tailwind classes to our custom styling
    function convertTailwindContent(element) {
        // Clone the element to avoid modifying the original
        const clonedElement = element.cloneNode(true);

        // Remove Tailwind classes but preserve essential ones
        const elementsToProcess = clonedElement.querySelectorAll("*");
        elementsToProcess.forEach((el) => {
            // Convert specific Tailwind classes to our custom classes
            if (el.classList.contains("prose")) {
                el.classList.remove("prose");
                el.classList.add("perplexity-prose");
            }

            // Handle links
            if (el.tagName === "A") {
                el.classList.add("perplexity-link");
            }

            // Handle code blocks
            if (el.tagName === "PRE") {
                el.classList.add("perplexity-code-block");
                // Find code element inside pre
                const code = el.querySelector("code");
                if (code) {
                    code.classList.add("perplexity-code");
                }
            }

            // Handle inline code
            if (el.tagName === "CODE" && el.parentElement.tagName !== "PRE") {
                el.classList.add("perplexity-inline-code");
            }

            // Handle lists
            if (el.tagName === "UL") {
                el.classList.add("perplexity-list");
            }
            if (el.tagName === "OL") {
                el.classList.add("perplexity-ordered-list");
            }
            if (el.tagName === "LI") {
                el.classList.add("perplexity-list-item");
            }

            // Remove all Tailwind classes
            const classList = Array.from(el.classList);
            classList.forEach((className) => {
                if (
                    className.match(
                        /^(text-|bg-|p-|m-|flex|grid|border|rounded)/
                    )
                ) {
                    el.classList.remove(className);
                }
            });
        });

        return clonedElement;
    }

    // Convert the main answer content
    const convertedAnswer = convertTailwindContent(mainAnswer);

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
        answerHtml: convertedAnswer.innerHTML,
        sources: sources,
        timestamp: new Date().toISOString(),
        isLoggedIn: true,
    };
}
