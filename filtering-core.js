(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ThotBGoneFilter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PLATFORM_DOMAINS = [
    "onlyfans.com",
    "fansly.com",
    "fanvue.com",
    "fancentro.com",
    "justfor.fans",
    "mym.fans"
  ];

  const EXPLICIT_PATTERNS = [
    /\bnsfw\b/i,
    /\bexplicit content\b/i,
    /\badult content\b/i,
    /\bnudes?\b/i,
    /\blewd\b/i,
    /\bxxx\b/i
  ];

  const PROMOTION_PATTERNS = [
    /\blink in bio\b/i,
    /\bexclusive content\b/i,
    /\bsubscribe (?:to|for)\b/i,
    /\b(?:dm|message) me for content\b/i
  ];

  function normalize(value) {
    return String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function normalizeHandle(value) {
    return normalize(value).replace(/^@/, "").replace(/[^a-z0-9_]/g, "");
  }

  function hostMatches(hostname, domain) {
    return hostname === domain || hostname.endsWith(`.${domain}`);
  }

  function matchesPlatformUrl(value) {
    if (!value) return false;
    try {
      const url = new URL(value, "https://x.com");
      return PLATFORM_DOMAINS.some(domain => hostMatches(url.hostname.toLowerCase(), domain));
    } catch {
      const text = normalize(value);
      return PLATFORM_DOMAINS.some(domain => text.includes(domain));
    }
  }

  function classifyContent(input, settings) {
    const text = normalize(input.text);
    const author = normalizeHandle(input.author);
    const urls = Array.isArray(input.urls) ? input.urls : [];
    const allowlist = (settings.allowlist || []).map(normalizeHandle).filter(Boolean);
    const blocklist = (settings.blocklist || []).map(normalizeHandle).filter(Boolean);

    if (author && allowlist.includes(author)) return { blocked: false, reason: "allowlist" };
    if (author && blocklist.includes(author)) return { blocked: true, reason: "blocked account" };

    if (settings.blockPlatformLinks && (
      urls.some(matchesPlatformUrl) || PLATFORM_DOMAINS.some(domain => text.includes(domain))
    )) {
      return { blocked: true, reason: "adult-platform link" };
    }

    if (settings.blockExplicitTerms && EXPLICIT_PATTERNS.some(pattern => pattern.test(text))) {
      return { blocked: true, reason: "explicit phrase" };
    }

    if (settings.sensitivity === "strict" && PROMOTION_PATTERNS.some(pattern => pattern.test(text))) {
      return { blocked: true, reason: "promotional phrase" };
    }

    return { blocked: false, reason: "none" };
  }

  return { PLATFORM_DOMAINS, normalizeHandle, matchesPlatformUrl, classifyContent };
});
