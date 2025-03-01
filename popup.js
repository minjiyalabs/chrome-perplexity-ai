document.getElementById("check-login").addEventListener("click", function () {
    // Open Perplexity in a new tab to check login status
    chrome.tabs.create(
        { url: "https://www.perplexity.ai", active: true },
        function (tab) {
            // Listen for this tab to complete loading
            chrome.tabs.onUpdated.addListener(function listener(
                tabId,
                changeInfo
            ) {
                if (tabId === tab.id && changeInfo.status === "complete") {
                    // Tab has loaded, now check login status
                    setTimeout(() => {
                        chrome.runtime.sendMessage({
                            action: "checkPerplexityLogin",
                            tabId: tab.id,
                        });

                        // Update status in popup
                        document.getElementById("status").textContent =
                            "Checking login status...";
                        document.getElementById("status").style.color = "blue";

                        // Remove this listener
                        chrome.tabs.onUpdated.removeListener(listener);
                    }, 2000); // Give the page time to fully render
                }
            });
        }
    );
});

// On popup open, check if we're logged in to Perplexity
chrome.storage.local.get(
    ["perplexityLoginStatus", "lastCheck"],
    function (data) {
        const statusElement = document.getElementById("status");

        if (data.perplexityLoginStatus === "loggedIn") {
            const lastCheck = new Date(data.lastCheck);
            const hoursSinceCheck = (new Date() - lastCheck) / (1000 * 60 * 60);

            if (hoursSinceCheck < 24) {
                statusElement.textContent = "Logged in to Perplexity";
                statusElement.style.color = "green";
            } else {
                statusElement.textContent = "Login status needs verification";
                statusElement.style.color = "orange";
            }
        } else {
            statusElement.textContent = "Not logged in to Perplexity";
            statusElement.style.color = "red";
        }
    }
);

// Listen for storage changes to update UI in real-time
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.perplexityLoginStatus) {
        const statusElement = document.getElementById("status");
        if (changes.perplexityLoginStatus.newValue === "loggedIn") {
            statusElement.textContent = "Logged in to Perplexity";
            statusElement.style.color = "green";
        } else {
            statusElement.textContent = "Not logged in to Perplexity";
            statusElement.style.color = "red";
        }
    }
});
