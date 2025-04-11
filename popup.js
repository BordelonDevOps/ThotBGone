// Popup script for Thot-B-Gone

// DOM elements for settings
const enabledToggle = document.getElementById('enabled');
const blockAdultContentToggle = document.getElementById('blockAdultContent');
const blockOnlyFansFanslyToggle = document.getElementById('blockOnlyFansFansly');
const showWarningsToggle = document.getElementById('showWarnings');
const resetStatsButton = document.getElementById('resetStats');

// DOM elements for total stats
const totalBlocked = document.getElementById('total-blocked');
const totalAdult = document.getElementById('total-adult');
const totalOnlyfans = document.getElementById('total-onlyfans');
const totalTweets = document.getElementById('total-tweets');
const totalProfiles = document.getElementById('total-profiles');
const totalLinks = document.getElementById('total-links');
const totalScanned = document.getElementById('total-scanned');
const totalLastReset = document.getElementById('total-last-reset');

// DOM elements for session stats
const sessionBlocked = document.getElementById('session-blocked');
const sessionAdult = document.getElementById('session-adult');
const sessionOnlyfans = document.getElementById('session-onlyfans');
const sessionTweets = document.getElementById('session-tweets');
const sessionProfiles = document.getElementById('session-profiles');
const sessionLinks = document.getElementById('session-links');
const sessionScanned = document.getElementById('session-scanned');

// Session statistics (reset when browser closes)
const sessionStats = {
  totalBlocked: 0,
  adultContentBlocked: 0,
  onlyFansFanslyBlocked: 0,
  tweetsBlocked: 0,
  profilesBlocked: 0,
  linksBlocked: 0,
  tweetsScanned: 0
};

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['enabled', 'blockAdultContent', 'blockOnlyFansFansly', 'showWarnings'], (result) => {
    enabledToggle.checked = result.enabled !== false;
    blockAdultContentToggle.checked = result.blockAdultContent !== false;
    blockOnlyFansFanslyToggle.checked = result.blockOnlyFansFansly !== false;
    showWarningsToggle.checked = result.showWarnings !== false;
  });
}

// Load statistics from storage
function loadStats() {
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
    
    // Update total stats display
    totalBlocked.textContent = stats.totalBlocked;
    totalAdult.textContent = stats.adultContentBlocked;
    totalOnlyfans.textContent = stats.onlyFansFanslyBlocked;
    totalTweets.textContent = stats.tweetsBlocked;
    totalProfiles.textContent = stats.profilesBlocked;
    totalLinks.textContent = stats.linksBlocked;
    totalScanned.textContent = stats.tweetsScanned;
    
    // Format last reset date
    const lastReset = new Date(stats.lastReset);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    totalLastReset.textContent = `Last reset: ${lastReset.toLocaleDateString(undefined, options)}`;
    
    // Calculate session stats (difference between total and session start)
    const newBlocked = stats.totalBlocked - sessionStats.totalBlocked;
    if (newBlocked > 0) {
      sessionStats.totalBlocked += newBlocked;
    }
    
    const newAdult = stats.adultContentBlocked - sessionStats.adultContentBlocked;
    if (newAdult > 0) {
      sessionStats.adultContentBlocked += newAdult;
    }
    
    const newOnlyfans = stats.onlyFansFanslyBlocked - sessionStats.onlyFansFanslyBlocked;
    if (newOnlyfans > 0) {
      sessionStats.onlyFansFanslyBlocked += newOnlyfans;
    }
    
    const newTweets = stats.tweetsBlocked - sessionStats.tweetsBlocked;
    if (newTweets > 0) {
      sessionStats.tweetsBlocked += newTweets;
    }
    
    const newProfiles = stats.profilesBlocked - sessionStats.profilesBlocked;
    if (newProfiles > 0) {
      sessionStats.profilesBlocked += newProfiles;
    }
    
    const newLinks = stats.linksBlocked - sessionStats.linksBlocked;
    if (newLinks > 0) {
      sessionStats.linksBlocked += newLinks;
    }
    
    const newScanned = stats.tweetsScanned - sessionStats.tweetsScanned;
    if (newScanned > 0) {
      sessionStats.tweetsScanned += newScanned;
    }
    
    // Update session stats display
    sessionBlocked.textContent = sessionStats.totalBlocked;
    sessionAdult.textContent = sessionStats.adultContentBlocked;
    sessionOnlyfans.textContent = sessionStats.onlyFansFanslyBlocked;
    sessionTweets.textContent = sessionStats.tweetsBlocked;
    sessionProfiles.textContent = sessionStats.profilesBlocked;
    sessionLinks.textContent = sessionStats.linksBlocked;
    sessionScanned.textContent = sessionStats.tweetsScanned;
  });
}

// Save settings to storage
function saveSettings() {
  const settings = {
    enabled: enabledToggle.checked,
    blockAdultContent: blockAdultContentToggle.checked,
    blockOnlyFansFansly: blockOnlyFansFanslyToggle.checked,
    showWarnings: showWarningsToggle.checked
  };
  
  chrome.storage.sync.set(settings, () => {
    // Notify content script of settings change
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: settings
    });
  });
}

// Reset statistics
function resetStats() {
  chrome.runtime.sendMessage({ action: 'resetStats' }, (response) => {
    if (response && response.success) {
      // Reset session stats
      Object.keys(sessionStats).forEach(key => {
        sessionStats[key] = 0;
      });
      
      // Reload stats display
      loadStats();
    }
  });
}

// Tab switching functionality
function setupTabs() {
  const tabs = document.querySelectorAll('.stats-tab');
  const contents = document.querySelectorAll('.stats-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-stats`).classList.add('active');
    });
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Load settings and stats
  loadSettings();
  loadStats();
  
  // Set up tabs
  setupTabs();
  
  // Set up auto-refresh for stats
  setInterval(loadStats, 2000);
});

// Event listeners for settings changes
enabledToggle.addEventListener('change', saveSettings);
blockAdultContentToggle.addEventListener('change', saveSettings);
blockOnlyFansFanslyToggle.addEventListener('change', saveSettings);
showWarningsToggle.addEventListener('change', saveSettings);
resetStatsButton.addEventListener('click', resetStats);
