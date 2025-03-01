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
        <div class="perplexity-logo">
        <svg viewBox="0 0 101 116" stroke="#ffffff" fill="none" xmlns="http://www.w3.org/2000/svg"><path class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" d="M86.4325 6.53418L50.4634 36.9696H86.4325V6.53418Z" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M50.4625 36.9696L17.2603 6.53418V36.9696H50.4625Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M50.4634 1L50.4634 114.441" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M83.6656 70.172L50.4634 36.9697V79.3026L83.6656 108.908V70.172Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M17.2603 70.172L50.4625 36.9697V78.4497L17.2603 108.908V70.172Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M3.42627 36.9697V81.2394H17.2605V70.172L50.4628 36.9697H3.42627Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M50.4634 36.9697L83.6656 70.172V81.2394H97.4999V36.9697L50.4634 36.9697Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path></svg>
        </div>
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
