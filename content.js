chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "fetchPerplexityResults") {
        // Extract search query from Google search
        const searchInput = document.querySelector('input[name="q"]');
        if (!searchInput || !searchInput.value) return;

        // Create placeholder for Perplexity results
        insertPlaceholder();

        // Request perplexity results from background script
        chrome.runtime.sendMessage({
            action: "getPerplexityResults",
            query: searchInput.value,
        });
    }

    if (request.action === "displayPerplexityResults") {
        displayResults(request.results);
    }
});

function insertPlaceholder() {
    // Don't add duplicate placeholders
    if (document.getElementById("perplexity-container")) return;

    const searchResults = document.getElementById("search");
    if (!searchResults) return;

    const container = document.createElement("div");
    container.id = "perplexity-container";
    container.className = "perplexity-results";
    container.innerHTML = `
      <div class="perplexity-header">
        <img src="${chrome.runtime.getURL(
            "images/perplexity-logo.png"
        )}" alt="Perplexity AI" class="perplexity-logo">
        <span>Perplexity AI results</span>
      </div>
      <div class="perplexity-content">
        <div class="perplexity-loading">Loading results from Perplexity...</div>
      </div>
    `;

    searchResults.parentNode.insertBefore(container, searchResults);
}

function displayResults(results) {
    const container = document.getElementById("perplexity-container");
    if (!container) return;

    if (results.error) {
        container.querySelector(".perplexity-content").innerHTML = `
        <div class="perplexity-error">
          ${results.error}
          <a href="https://www.perplexity.ai" target="_blank">Sign in to Perplexity</a>
        </div>
      `;
        return;
    }

    container.querySelector(".perplexity-content").innerHTML = `
      <div class="perplexity-answer">
        ${results.answerHtml}
      </div>
      ${
          results.sources.length > 0
              ? `
        <div class="perplexity-sources">
          <h4>Sources:</h4>
          <ul>
            ${results.sources
                .map(
                    (src) =>
                        `<li><a href="${src.url}" target="_blank">${src.text}</a></li>`
                )
                .join("")}
          </ul>
        </div>
      `
              : ""
      }
    `;
}
