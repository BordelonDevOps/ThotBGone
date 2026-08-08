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

const ids = ["enabled", "blockPlatformLinks", "blockExplicitTerms", "showWarnings"];
const elements = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const status = document.getElementById("status");
const allowlist = document.getElementById("allowlist");
const blocklist = document.getElementById("blocklist");

function parseHandles(value) {
  return [...new Set(value.split(/[\n,]/).map(item => item.trim().replace(/^@/, "")).filter(Boolean))];
}

function updateStatus(enabled, message) {
  status.textContent = message || (enabled ? "Filtering is active on X" : "Filtering is paused");
  status.classList.toggle("off", !enabled);
}

async function loadSettings() {
  const settings = await chrome.storage.sync.get(DEFAULTS);
  ids.forEach(id => { elements[id].checked = settings[id]; });
  document.querySelector(`input[name="sensitivity"][value="${settings.sensitivity}"]`).checked = true;
  allowlist.value = settings.allowlist.join("\n");
  blocklist.value = settings.blocklist.join("\n");
  updateStatus(settings.enabled);
}

async function saveSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });
  const enabled = key === "enabled" ? value : elements.enabled.checked;
  updateStatus(enabled, "Saved. Open X pages update automatically.");
}

async function loadStats() {
  const { stats = {} } = await chrome.storage.local.get("stats");
  ["totalBlocked", "platformLinks", "explicitPhrases", "promotionalPhrases"].forEach(id => {
    document.getElementById(id).textContent = Number(stats[id] || 0).toLocaleString();
  });
  document.getElementById("lastReset").textContent = stats.lastReset
    ? `Reset ${new Date(stats.lastReset).toLocaleString()}`
    : "Statistics begin after installation";
}

ids.forEach(id => {
  elements[id].addEventListener("change", () => saveSetting(id, elements[id].checked));
});

document.querySelectorAll('input[name="sensitivity"]').forEach(input => {
  input.addEventListener("change", () => saveSetting("sensitivity", input.value));
});

document.getElementById("saveLists").addEventListener("click", async () => {
  const next = {
    allowlist: parseHandles(allowlist.value),
    blocklist: parseHandles(blocklist.value)
  };
  await chrome.storage.sync.set(next);
  allowlist.value = next.allowlist.join("\n");
  blocklist.value = next.blocklist.join("\n");
  updateStatus(elements.enabled.checked, "Account lists saved.");
});

document.getElementById("resetStats").addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ action: "resetStats" });
  if (response?.success) await loadStats();
});

Promise.all([loadSettings(), loadStats()]).catch(error => {
  console.error(error);
  updateStatus(false, "Unable to load extension settings.");
});
