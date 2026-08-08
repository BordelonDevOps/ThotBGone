"use strict";

const DEFAULT_SETTINGS = {
  enabled: true,
  blockPlatformLinks: true,
  blockExplicitTerms: true,
  showWarnings: true,
  sensitivity: "balanced",
  allowlist: [],
  blocklist: []
};

const EMPTY_STATS = {
  totalBlocked: 0,
  platformLinks: 0,
  explicitPhrases: 0,
  promotionalPhrases: 0,
  blockedAccounts: 0,
  lastReset: null
};

let statsQueue = Promise.resolve();

function setIcon(enabled) {
  const suffix = enabled ? "" : "_disabled";
  return chrome.action.setIcon({
    path: {
      16: `icon16${suffix}.png`,
      48: `icon48${suffix}.png`,
      128: `icon128${suffix}.png`
    }
  });
}

async function initialize() {
  const current = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set(current);
  const local = await chrome.storage.local.get("stats");
  if (!local.stats) {
    await chrome.storage.local.set({ stats: { ...EMPTY_STATS, lastReset: new Date().toISOString() } });
  }
  await setIcon(current.enabled);
}

chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enabled) setIcon(changes.enabled.newValue).catch(() => {});
});

function recordEvent(reason) {
  statsQueue = statsQueue.then(async () => {
    const result = await chrome.storage.local.get("stats");
    const stats = { ...EMPTY_STATS, ...result.stats };
    stats.totalBlocked += 1;
    if (reason === "adult-platform link") stats.platformLinks += 1;
    if (reason === "explicit phrase") stats.explicitPhrases += 1;
    if (reason === "promotional phrase") stats.promotionalPhrases += 1;
    if (reason === "blocked account") stats.blockedAccounts += 1;
    await chrome.storage.local.set({ stats });
  });
  return statsQueue;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "recordEvent") {
    recordEvent(message.reason).then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === "resetStats") {
    chrome.storage.local.set({
      stats: { ...EMPTY_STATS, lastReset: new Date().toISOString() }
    }).then(() => sendResponse({ success: true }));
    return true;
  }

  return false;
});

initialize().catch(error => console.error("Thot-B-Gone initialization failed", error));
