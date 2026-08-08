"use strict";

const assert = require("node:assert/strict");
const filter = require("../filtering-core.js");

const balanced = {
  blockPlatformLinks: true,
  blockExplicitTerms: true,
  sensitivity: "balanced",
  allowlist: [],
  blocklist: []
};

assert.equal(filter.matchesPlatformUrl("https://onlyfans.com/example"), true);
assert.equal(filter.matchesPlatformUrl("https://example.com/?next=onlyfans.com"), false);
assert.equal(filter.classifyContent({ text: "New article. Subscribe for updates.", urls: [], author: "news" }, balanced).blocked, false);
assert.equal(filter.classifyContent({ text: "My explicit content", urls: [], author: "user" }, balanced).reason, "explicit phrase");
assert.equal(filter.classifyContent({ text: "profile", urls: ["https://fansly.com/demo"], author: "user" }, balanced).reason, "adult-platform link");
assert.equal(filter.classifyContent({ text: "explicit content", urls: [], author: "trusted" }, { ...balanced, allowlist: ["@trusted"] }).blocked, false);
assert.equal(filter.classifyContent({ text: "ordinary post", urls: [], author: "blocked_user" }, { ...balanced, blocklist: ["blocked_user"] }).reason, "blocked account");
assert.equal(filter.classifyContent({ text: "link in bio", urls: [], author: "user" }, balanced).blocked, false);
assert.equal(filter.classifyContent({ text: "link in bio", urls: [], author: "user" }, { ...balanced, sensitivity: "strict" }).reason, "promotional phrase");

console.log("Filtering core tests passed.");
