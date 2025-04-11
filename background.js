// Background script for Thot-B-Gone
// Handles settings management and statistics tracking

// Initialize extension settings and statistics on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enabled: true,
    blockAdultContent: true,
    blockOnlyFansFansly: true,
    showWarnings: true,
    stats: {
      totalBlocked: 0,
      adultContentBlocked: 0,
      onlyFansFanslyBlocked: 0,
      tweetsBlocked: 0,
      profilesBlocked: 0,
      linksBlocked: 0,
      tweetsScanned: 0,
      lastReset: new Date().toISOString()
    }
  }, () => {
    console.log('Thot-B-Gone initialized with default settings');
    updateIcon(true);
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle getting settings and stats
  if (message.action === 'getSettings') {
    chrome.storage.sync.get(['enabled', 'blockAdultContent', 'blockOnlyFansFansly', 'showWarnings', 'stats'], (result) => {
      sendResponse(result);
    });
    return true; // Required for async sendResponse
  } 
  // Handle updating settings
  else if (message.action === 'updateSettings') {
    chrome.storage.sync.set(message.settings, () => {
      if (message.settings.hasOwnProperty('enabled')) {
        updateIcon(message.settings.enabled);
      }
      sendResponse({ success: true });
    });
    return true; // Required for async sendResponse
  } 
  // Handle updating stats when content is blocked
  else if (message.action === 'updateStats') {
    chrome.storage.sync.get('stats', (result) => {
      const stats = result.stats || {
        totalBlocked: 0,
        adultContentBlocked: 0,
        onlyFansFanslyBlocked: 0,
        tweetsBlocked: 0,
        profilesBlocked: 0,
        linksBlocked: 0,
        tweetsScanned: 0,
        lastReset: new Date().toISOString()
      };
      
      // Update statistics based on what was blocked
      stats.totalBlocked++;
      
      if (message.contentType === 'adult') {
        stats.adultContentBlocked++;
      } else if (message.contentType === 'onlyfans') {
        stats.onlyFansFanslyBlocked++;
      }
      
      if (message.elementType === 'tweet') {
        stats.tweetsBlocked++;
      } else if (message.elementType === 'profile') {
        stats.profilesBlocked++;
      } else if (message.elementType === 'link') {
        stats.linksBlocked++;
      }

      if (message.tweetsScanned) {
        stats.tweetsScanned += message.tweetsScanned;
      }
      
      // Save updated statistics
      chrome.storage.sync.set({ stats: stats }, () => {
        sendResponse({ success: true, stats: stats });
      });
    });
    return true; // Required for async sendResponse
  } 
  // Handle resetting stats
  else if (message.action === 'resetStats') {
    const resetStats = {
      totalBlocked: 0,
      adultContentBlocked: 0,
      onlyFansFanslyBlocked: 0,
      tweetsBlocked: 0,
      profilesBlocked: 0,
      linksBlocked: 0,
      tweetsScanned: 0,
      lastReset: new Date().toISOString()
    };
    
    chrome.storage.sync.set({ stats: resetStats }, () => {
      sendResponse({ success: true, stats: resetStats });
    });
    return true; // Required for async sendResponse
  }
});

// Update extension icon based on enabled state
function updateIcon(enabled) {
  const iconPath = enabled ? {
    16: "images/icon16.png",
    48: "images/icon48.png",
    128: "images/icon128.png"
  } : {
    16: "images/icon16_disabled.png",
    48: "images/icon48_disabled.png",
    128: "images/icon128_disabled.png"
  };
  
  chrome.action.setIcon({ path: iconPath });
}

// Initialize icon on startup
chrome.storage.sync.get('enabled', (result) => {
  updateIcon(result.enabled !== false);
});
