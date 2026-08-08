# Thot-B-Gone

Thot-B-Gone is a privacy-focused Chrome extension that filters selected adult promotions from X timelines. Version 2 replaces the original broad keyword scanner with a smaller, testable rules engine and clear user controls.

## What it does

- Detects links to configured adult-content platforms.
- Detects high-confidence explicit phrases.
- Offers Balanced and Strict sensitivity modes.
- Supports per-account allow and block lists.
- Collapses matching posts with a one-time reveal button, or hides them completely.
- Stores preferences with `chrome.storage.sync` and aggregate counters with `chrome.storage.local`.
- Runs entirely in the browser on X and Twitter pages. It sends no browsing data to a server.

The extension does not use image recognition, machine learning, or remote moderation services. Text and link rules can produce false positives or miss content, so the user remains in control.

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose this repository folder.
5. Open X and use the toolbar popup to configure filtering.

After updating the source, select **Reload** on the extension card in `chrome://extensions/` and refresh any open X tabs.

## Development

Run the filtering-engine tests with:

```powershell
node tests/filtering-core.test.js
```

The extension uses Manifest V3 and has no build step or third-party runtime dependencies.

## Privacy and limitations

- Settings and aggregate counts remain in Chrome storage.
- No post text, account information, or browsing history is transmitted.
- X can change its page structure, which may require selector updates.
- Shortened links may not expose their destination until X resolves them.
- Filtering is rules-based and is not a substitute for X's safety controls.

## License

MIT
