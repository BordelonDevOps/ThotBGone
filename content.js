(() => {
  "use strict";

  const DEFAULTS = {
    enabled: true,
    blockPlatformLinks: true,
    blockExplicitTerms: true,
    showWarnings: true,
    sensitivity: "balanced",
    allowlist: [],
    blocklist: []
  };

  let settings = { ...DEFAULTS };
  let observer = null;
  let scanTimer = null;

  function getAuthor(article) {
    const statusLink = article.querySelector('a[href*="/status/"]');
    const match = statusLink?.getAttribute("href")?.match(/^\/([^/]+)\/status\//);
    return match ? match[1] : "";
  }

  function revealArticle(article) {
    article.classList.remove("tbg-hidden");
    article.removeAttribute("data-tbg-filtered");
    if (article.previousElementSibling?.classList.contains("tbg-placeholder")) {
      article.previousElementSibling.remove();
    }
  }

  function filterArticle(article, result) {
    if (article.dataset.tbgFiltered === result.reason) return;
    revealArticle(article);
    article.dataset.tbgFiltered = result.reason;
    article.classList.add("tbg-hidden");

    if (settings.showWarnings) {
      const placeholder = document.createElement("div");
      placeholder.className = "tbg-placeholder";
      placeholder.setAttribute("role", "status");
      const label = document.createElement("span");
      label.textContent = `Filtered by Thot-B-Gone: ${result.reason}`;
      const reveal = document.createElement("button");
      reveal.type = "button";
      reveal.textContent = "Show this post";
      reveal.addEventListener("click", () => {
        placeholder.remove();
        article.classList.remove("tbg-hidden");
        article.dataset.tbgRevealed = "true";
      }, { once: true });
      placeholder.append(label, reveal);
      article.before(placeholder);
    }

    chrome.runtime.sendMessage({ action: "recordEvent", reason: result.reason }).catch(() => {});
  }

  function scan() {
    scanTimer = null;
    if (!settings.enabled) return;

    document.querySelectorAll('article[data-testid="tweet"]').forEach(article => {
      if (article.dataset.tbgRevealed === "true") return;
      const text = article.innerText || article.textContent || "";
      const urls = [...article.querySelectorAll("a[href]")].map(link => link.href);
      const author = getAuthor(article);
      const signature = JSON.stringify([text, urls, author, settings]);
      if (article.dataset.tbgSignature === signature) return;
      article.dataset.tbgSignature = signature;
      const result = ThotBGoneFilter.classifyContent(
        { text, urls, author },
        settings
      );
      if (result.blocked) filterArticle(article, result);
      else revealArticle(article);
    });
  }

  function scheduleScan() {
    if (scanTimer !== null) return;
    scanTimer = window.setTimeout(scan, 120);
  }

  function stopFiltering() {
    observer?.disconnect();
    observer = null;
    if (scanTimer !== null) window.clearTimeout(scanTimer);
    scanTimer = null;
    document.querySelectorAll('article[data-tbg-filtered]').forEach(revealArticle);
  }

  function startFiltering() {
    if (!document.body) return;
    observer?.disconnect();
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, { childList: true, subtree: true });
    scan();
  }

  function applySettings(next) {
    settings = { ...DEFAULTS, ...next };
    document.querySelectorAll('article[data-tbg-revealed], article[data-tbg-signature]').forEach(node => {
      node.removeAttribute("data-tbg-revealed");
      node.removeAttribute("data-tbg-signature");
    });
    if (settings.enabled) startFiltering();
    else stopFiltering();
  }

  chrome.storage.sync.get(DEFAULTS, applySettings);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    const next = { ...settings };
    Object.entries(changes).forEach(([key, value]) => { next[key] = value.newValue; });
    applySettings(next);
  });
})();
