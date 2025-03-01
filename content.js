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
        <span>Perplexity</span>
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

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = results.answerHtml;

    // Transform buttons into headings
    tempDiv.querySelectorAll("button").forEach((button) => {
        const heading = document.createElement("a");
        heading.innerHTML = button.innerHTML;
        heading.className = "perplexity-heading";
        heading.style.textDecoration = "underline";
        heading.style.textDecorationColor = "var(--perplexity-accent)";

        // Copy any relevant attributes
        if (button.dataset.citationIndex) {
            heading.dataset.citationIndex = button.dataset.citationIndex;
        }
        button.parentNode.replaceChild(heading, button);
    });

    // Process citations
    const citations = new Map();
    tempDiv.querySelectorAll("[data-citation-index]").forEach((el) => {
        const index = el.dataset.citationIndex;
        const source = results.sources.find((s) =>
            s.text.includes(`[${index}]`)
        );
        if (source) {
            citations.set(index, source);
            // Add citation number as superscript
            const sup = document.createElement("sup");
            sup.className = "citation";
            sup.textContent = `[${index}]`;
            el.appendChild(sup);
        }
    });

    const content = container.querySelector(".perplexity-content");
    content.innerHTML = `
      <div class="perplexity-answer-wrapper">
        <div class="perplexity-answer-container">
          <div class="perplexity-response-header">
            <div class="perplexity-avatar">
              <svg viewBox="0 0 101 116" stroke="#ffffff" fill="none" xmlns="http://www.w3.org/2000/svg"><path class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" d="M86.4325 6.53418L50.4634 36.9696H86.4325V6.53418Z" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M50.4625 36.9696L17.2603 6.53418V36.9696H50.4625Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M50.4634 1L50.4634 114.441" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M83.6656 70.172L50.4634 36.9697V79.3026L83.6656 108.908V70.172Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M17.2603 70.172L50.4625 36.9697V78.4497L17.2603 108.908V70.172Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M3.42627 36.9697V81.2394H17.2605V70.172L50.4628 36.9697H3.42627Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path><path d="M50.4634 36.9697L83.6656 70.172V81.2394H97.4999V36.9697L50.4634 36.9697Z" class="stroke-textMain dark:stroke-textMainDark group-hover:stroke-superDuper transition-colors duration-300" stroke-width="5.53371" stroke-miterlimit="10"></path></svg>
            </div>
            <span class="perplexity-response-label">Response</span>
          </div>
          <div class="perplexity-answer">
            ${tempDiv.innerHTML}
          </div>
        </div>
      </div>
      <div class="perplexity-expand-button" style="display: none;">
        <button>
          <span class="expand-text">Show More</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
      ${
          results.sources.length > 0
              ? `
        <div class="perplexity-sources">
          <div class="perplexity-sources-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <h4>Sources</h4>
          </div>
          <ul>
            ${Array.from(citations.entries())
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(
                    ([index, source]) =>
                        `<li>
                          <span class="citation-index">[${index}]</span>
                          <a href="${source.url}" target="_blank" class="source-link">
                            ${source.text}
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        </li>`
                )
                .join("")}
          </ul>
        </div>
      `
              : ""
      }
    `;

    // Check if content is taller than 200px
    const wrapper = content.querySelector(".perplexity-answer-wrapper");
    if (wrapper.scrollHeight > 200) {
        wrapper.style.maxHeight = "200px";
        const expandButton = content.querySelector(".perplexity-expand-button");
        expandButton.style.display = "flex";

        expandButton
            .querySelector("button")
            .addEventListener("click", function () {
                const isExpanded = wrapper.style.maxHeight === "none";
                wrapper.style.maxHeight = isExpanded ? "200px" : "none";
                this.classList.toggle("expanded");
                this.querySelector(".expand-text").textContent = isExpanded
                    ? "Show More"
                    : "Show Less";
            });
    }
}
