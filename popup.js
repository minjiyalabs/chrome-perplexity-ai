document.getElementById("check-login").addEventListener("click", function () {
    // Open Perplexity in a new tab to check login status
    chrome.tabs.create({ url: "https://www.perplexity.ai" });
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
