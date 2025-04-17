
# 🛡️ Thot-B-Gone

**Thot-B-Gone** is a Chrome extension that scans your Twitter/X timeline and hides or flags adult content, including posts promoting OnlyFans, Fansly, and other NSFW platforms.

## 🔧 Features

- ✅ Block adult content keywords like "nudes", "subscribe", and "explicit"
- ✅ Auto-detect and filter URLs to platforms like OnlyFans and Fansly
- ✅ Optional warning overlay instead of outright hiding tweets
- ✅ Real-time scan counter for session activity
- ✅ Simple toggleable settings via extension popup

## 📦 Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer Mode** (top-right).
4. Click **Load unpacked** and select the `thotbgone` folder.
5. You're good to go.

## ⚙️ Settings

Access the extension popup to toggle:

- 🔘 Enable/disable extension  
- 🔘 Block adult keywords  
- 🔘 Block OnlyFans/Fansly links  
- 🔘 Show warning instead of hiding tweet

Your settings are saved using `chrome.storage.sync`.

## 📂 Project Structure

```
thotbgone/
├── icons/               # Extension icons
├── content.js           # Scans tweets and hides content
├── popup.html           # Popup UI
├── popup.js             # Settings logic
├── manifest.json        # Chrome extension manifest
```

## 🧠 How It Works

The content script scans visible tweets in real-time for:

- Adult-related **keywords**
- Known **URL patterns** to adult platforms

If matched, the tweet is hidden or replaced with a warning (based on user config).

## ⚠️ Known Limitations

- May miss embedded or dynamically-loaded media
- Detection depends on keyword pattern matching
- Optimized for standard Twitter UI layout

## 📬 Contact

Created by **Christopher Bordelon**  
📧 bordelondevops2025@gmail.com  
🔗 [GitHub @BordelonDevOps](https://github.com/BordelonDevOps)

## 📄 License

Licensed under the **MIT License**.
